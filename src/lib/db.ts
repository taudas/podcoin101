import type { D1Database } from "@cloudflare/workers-types"
import { getCloudflareContext } from "@opennextjs/cloudflare"

let initialized = false
let dbInstance: D1Database | null = null

export async function getDb(): Promise<D1Database> {
  const { env } = getCloudflareContext()

  if (dbInstance) return dbInstance
  
  // OpenNext maps D1 database to DB environment variable
  const db = env.DB as D1Database
  if (!db) {
    throw new Error("D1 Database not configured. Check env.DB is bound.")
  }
  if (!initialized) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        image TEXT,
        balance REAL NOT NULL DEFAULT 0,
        credit_limit REAL NOT NULL DEFAULT 500,
        neighborhood TEXT DEFAULT 'Alameda, CA',
        bio TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        price_podcoin REAL NOT NULL,
        category TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user_id TEXT REFERENCES users(id),
        to_user_id TEXT REFERENCES users(id),
        amount REAL NOT NULL,
        note TEXT DEFAULT '',
        type TEXT NOT NULL DEFAULT 'transfer',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `)
    initialized = true
  }
  dbInstance = db
  return db
}

export interface UserRecord {
  id: string
  name: string
  email: string
  image: string | null
  balance: number
  credit_limit: number
  neighborhood: string
  bio: string
  created_at: string
  updated_at: string
}

export interface ServiceRecord {
  id: number
  user_id: string
  title: string
  description: string | null
  price_podcoin: number
  category: string | null
  active: number
  created_at: string
}

export interface TransactionRecord {
  id: number
  from_user_id: string | null
  to_user_id: string | null
  amount: number
  note: string
  type: string
  created_at: string
}

export async function getOrCreateUser(user: {
  id: string
  name: string
  email: string
  image: string | null
}): Promise<UserRecord> {
  const db = await getDb()
  const existing = await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(user.id)
    .first() as UserRecord | undefined

  if (existing) {
    await db
      .prepare("UPDATE users SET name = ?, image = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(user.name, user.image, user.id)
      .run()
    return { ...existing, name: user.name, image: user.image }
  }

  await db
    .prepare("INSERT INTO users (id, name, email, image) VALUES (?, ?, ?, ?)")
    .bind(user.id, user.name, user.email, user.image)
    .run()

  return (await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(user.id)
    .first()) as UserRecord
}

export async function getUser(id: string): Promise<UserRecord | undefined> {
  const db = await getDb()
  return (await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first()) as UserRecord | undefined
}

export async function getUserBalance(
  id: string
): Promise<{ balance: number; credit_limit: number } | undefined> {
  const db = await getDb()
  return (await db
    .prepare("SELECT balance, credit_limit FROM users WHERE id = ?")
    .bind(id)
    .first()) as { balance: number; credit_limit: number } | undefined
}

export async function transfer(
  fromId: string,
  toId: string,
  amount: number,
  note: string
): Promise<{ transaction: TransactionRecord; fromBalance: number; toBalance: number }> {
  const db = await getDb()

  if (amount <= 0) throw new Error("Amount must be greater than zero")
  if (fromId === toId) throw new Error("Cannot transfer to yourself")

  // Validate sender and recipient exist
  const from = await db
    .prepare("SELECT balance, credit_limit FROM users WHERE id = ?")
    .bind(fromId)
    .first() as { balance: number; credit_limit: number } | undefined
  if (!from) throw new Error("Sender not found")

  const to = await db
    .prepare("SELECT balance FROM users WHERE id = ?")
    .bind(toId)
    .first() as { balance: number } | undefined
  if (!to) throw new Error("Recipient not found")

  // Check sufficient credit before the atomic batch (small TOCTOU window — acceptable for this app)
  if (from.balance - amount < -from.credit_limit) {
    throw new Error(
      `Insufficient credit. Your available credit is ₱${(from.balance + from.credit_limit).toFixed(2)}`
    )
  }

  // Atomic batch: all statements succeed or fail together on SQL error
  const batchResults = await db.batch([
    db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").bind(amount, fromId),
    db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").bind(amount, toId),
    db.prepare("INSERT INTO transactions (from_user_id, to_user_id, amount, note, type) VALUES (?, ?, ?, ?, 'transfer')").bind(fromId, toId, amount, note),
  ]) as { meta: { changes: number; last_row_id?: number } }[]

  // Use the INSERT's last_row_id to retrieve the transaction (no guessing needed)
  const transaction = (await db
    .prepare("SELECT * FROM transactions WHERE id = ?")
    .bind(batchResults[2].meta.last_row_id!)
    .first()) as TransactionRecord

  const fromUser = (await db
    .prepare("SELECT balance FROM users WHERE id = ?")
    .bind(fromId)
    .first()) as { balance: number }
  const toUser = (await db
    .prepare("SELECT balance FROM users WHERE id = ?")
    .bind(toId)
    .first()) as { balance: number }

  return { transaction, fromBalance: fromUser.balance, toBalance: toUser.balance }
}

export interface TransactionWithNames extends TransactionRecord {
  from_name: string | null
  to_name: string | null
}

export async function getTransactions(
  userId: string,
  limit = 50
): Promise<TransactionWithNames[]> {
  const db = await getDb()
  const result = await db
    .prepare(
      `SELECT t.*, 
        fu.name as from_name, 
        tu.name as to_name 
       FROM transactions t
       LEFT JOIN users fu ON t.from_user_id = fu.id
       LEFT JOIN users tu ON t.to_user_id = tu.id
       WHERE t.from_user_id = ? OR t.to_user_id = ?
       ORDER BY t.created_at DESC
       LIMIT ?`
    )
    .bind(userId, userId, limit)
    .all()

  return result.results as unknown as TransactionWithNames[]
}

export interface UserWithServices extends UserRecord {
  services: ServiceRecord[]
}

export async function getUsers(search?: string): Promise<UserWithServices[]> {
  const db = await getDb()
  let users: UserRecord[]

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    const result = await db
      .prepare(
        `SELECT DISTINCT u.* FROM users u
         LEFT JOIN services s ON s.user_id = u.id AND s.active = 1
         WHERE u.name LIKE ? OR u.neighborhood LIKE ? OR s.title LIKE ? OR s.category LIKE ?
         ORDER BY u.name`
      )
      .bind(term, term, term, term)
      .all()
    users = result.results as unknown as UserRecord[]
  } else {
    const result = await db
      .prepare("SELECT * FROM users ORDER BY name")
      .all()
    users = result.results as unknown as UserRecord[]
  }

  return Promise.all(
    users.map(async (user) => ({
      ...user,
      services: await getUserServices(user.id),
    }))
  )
}

export async function getUserServices(userId: string): Promise<ServiceRecord[]> {
  const db = await getDb()
  const result = await db
    .prepare("SELECT * FROM services WHERE user_id = ? AND active = 1 ORDER BY created_at DESC")
    .bind(userId)
    .all()
  return result.results as unknown as ServiceRecord[]
}

export async function addService(
  userId: string,
  service: { title: string; description?: string; price_podcoin: number; category?: string }
): Promise<ServiceRecord> {
  const db = await getDb()
  const result = await db
    .prepare("INSERT INTO services (user_id, title, description, price_podcoin, category) VALUES (?, ?, ?, ?, ?)")
    .bind(userId, service.title, service.description ?? null, service.price_podcoin, service.category ?? null)
    .run()

  return (await db
    .prepare("SELECT * FROM services WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first()) as ServiceRecord
}

export async function updateService(
  id: number,
  userId: string,
  service: { title?: string; description?: string; price_podcoin?: number; category?: string; active?: number }
): Promise<void> {
  const db = await getDb()
  const existing = await db
    .prepare("SELECT * FROM services WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first()
  if (!existing) throw new Error("Service not found")

  const fields: string[] = []
  const values: unknown[] = []

  if (service.title !== undefined) { fields.push("title = ?"); values.push(service.title) }
  if (service.description !== undefined) { fields.push("description = ?"); values.push(service.description) }
  if (service.price_podcoin !== undefined) { fields.push("price_podcoin = ?"); values.push(service.price_podcoin) }
  if (service.category !== undefined) { fields.push("category = ?"); values.push(service.category) }
  if (service.active !== undefined) { fields.push("active = ?"); values.push(service.active) }

  if (fields.length === 0) return
  values.push(id, userId)
  await db
    .prepare(`UPDATE services SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`)
    .bind(...values as [unknown, ...unknown[]])
    .run()
}

export async function deleteService(id: number, userId: string): Promise<void> {
  const db = await getDb()
  const result = await db
    .prepare("DELETE FROM services WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run()
  if ((result.meta?.changes ?? 0) === 0) throw new Error("Service not found")
}

export async function updateProfile(
  userId: string,
  data: { name?: string; bio?: string; neighborhood?: string }
): Promise<UserRecord> {
  const db = await getDb()
  const fields: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name) }
  if (data.bio !== undefined) { fields.push("bio = ?"); values.push(data.bio) }
  if (data.neighborhood !== undefined) { fields.push("neighborhood = ?"); values.push(data.neighborhood) }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')")
    values.push(userId)
    await db
      .prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values as [unknown, ...unknown[]])
      .run()
  }

  return (await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(userId)
    .first()) as UserRecord
}
