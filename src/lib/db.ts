import Database from "better-sqlite3"
import path from "path"

const DB_PATH = path.join(process.cwd(), "podcoin.db")

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma("journal_mode = WAL")
    db.pragma("foreign_keys = ON")
    initDb(db)
  }
  return db
}

function initDb(db: Database.Database): void {
  db.exec(`
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

export function getOrCreateUser(user: {
  id: string
  name: string
  email: string
  image: string | null
}): UserRecord {
  const database = getDb()
  const existing = database
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(user.id) as UserRecord | undefined

  if (existing) {
    database
      .prepare(
        "UPDATE users SET name = ?, image = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .run(user.name, user.image, user.id)
    return { ...existing, name: user.name, image: user.image }
  }

  database
    .prepare(
      "INSERT INTO users (id, name, email, image) VALUES (?, ?, ?, ?)"
    )
    .run(user.id, user.name, user.email, user.image)

  return database
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(user.id) as UserRecord
}

export function getUser(id: string): UserRecord | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as UserRecord | undefined
}

export function getUserBalance(
  id: string
): { balance: number; credit_limit: number } | undefined {
  return getDb()
    .prepare("SELECT balance, credit_limit FROM users WHERE id = ?")
    .get(id) as { balance: number; credit_limit: number } | undefined
}

export function transfer(
  fromId: string,
  toId: string,
  amount: number,
  note: string
): { transaction: TransactionRecord; fromBalance: number; toBalance: number } {
  const database = getDb()

  if (amount <= 0) throw new Error("Amount must be greater than zero")
  if (fromId === toId) throw new Error("Cannot transfer to yourself")

  const from = database
    .prepare("SELECT balance, credit_limit FROM users WHERE id = ?")
    .get(fromId) as { balance: number; credit_limit: number } | undefined
  if (!from) throw new Error("Sender not found")

  const to = database
    .prepare("SELECT balance FROM users WHERE id = ?")
    .get(toId) as { balance: number } | undefined
  if (!to) throw new Error("Recipient not found")

  if (from.balance - amount < -from.credit_limit) {
    throw new Error(
      `Insufficient credit. Your available credit is ₱${(from.balance + from.credit_limit).toFixed(2)}`
    )
  }

  const doTransfer = database.transaction(() => {
    database
      .prepare("UPDATE users SET balance = balance - ? WHERE id = ?")
      .run(amount, fromId)
    database
      .prepare("UPDATE users SET balance = balance + ? WHERE id = ?")
      .run(amount, toId)

    const result = database
      .prepare(
        "INSERT INTO transactions (from_user_id, to_user_id, amount, note, type) VALUES (?, ?, ?, ?, 'transfer')"
      )
      .run(fromId, toId, amount, note)

    const transaction = database
      .prepare("SELECT * FROM transactions WHERE id = ?")
      .get(result.lastInsertRowid) as TransactionRecord

    const fromUser = database
      .prepare("SELECT balance FROM users WHERE id = ?")
      .get(fromId) as { balance: number }
    const toUser = database
      .prepare("SELECT balance FROM users WHERE id = ?")
      .get(toId) as { balance: number }

    return { transaction, fromBalance: fromUser.balance, toBalance: toUser.balance }
  })

  return doTransfer()
}

export interface TransactionWithNames extends TransactionRecord {
  from_name: string | null
  to_name: string | null
}

export function getTransactions(
  userId: string,
  limit = 50
): TransactionWithNames[] {
  return getDb()
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
    .all(userId, userId, limit) as TransactionWithNames[]
}

export interface UserWithServices extends UserRecord {
  services: ServiceRecord[]
}

export function getUsers(search?: string): UserWithServices[] {
  const database = getDb()
  let users: UserRecord[]

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    users = database
      .prepare(
        `SELECT DISTINCT u.* FROM users u
         LEFT JOIN services s ON s.user_id = u.id AND s.active = 1
         WHERE u.name LIKE ? OR u.neighborhood LIKE ? OR s.title LIKE ? OR s.category LIKE ?
         ORDER BY u.name`
      )
      .all(term, term, term, term) as UserRecord[]
  } else {
    users = database
      .prepare("SELECT * FROM users ORDER BY name")
      .all() as UserRecord[]
  }

  return users.map((user) => ({
    ...user,
    services: database
      .prepare("SELECT * FROM services WHERE user_id = ? AND active = 1 ORDER BY created_at DESC")
      .all(user.id) as ServiceRecord[],
  }))
}

export function getUserServices(userId: string): ServiceRecord[] {
  return getDb()
    .prepare("SELECT * FROM services WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as ServiceRecord[]
}

export function addService(
  userId: string,
  service: { title: string; description?: string; price_podcoin: number; category?: string }
): ServiceRecord {
  const database = getDb()
  const result = database
    .prepare(
      "INSERT INTO services (user_id, title, description, price_podcoin, category) VALUES (?, ?, ?, ?, ?)"
    )
    .run(userId, service.title, service.description ?? null, service.price_podcoin, service.category ?? null)

  return database
    .prepare("SELECT * FROM services WHERE id = ?")
    .get(result.lastInsertRowid) as ServiceRecord
}

export function updateService(
  id: number,
  userId: string,
  service: { title?: string; description?: string; price_podcoin?: number; category?: string; active?: number }
): void {
  const database = getDb()
  const existing = database
    .prepare("SELECT * FROM services WHERE id = ? AND user_id = ?")
    .get(id, userId)
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
  database.prepare(`UPDATE services SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`).run(...values)
}

export function deleteService(id: number, userId: string): void {
  const database = getDb()
  const result = database
    .prepare("DELETE FROM services WHERE id = ? AND user_id = ?")
    .run(id, userId)
  if (result.changes === 0) throw new Error("Service not found")
}

export function updateProfile(
  userId: string,
  data: { name?: string; bio?: string; neighborhood?: string }
): UserRecord {
  const database = getDb()
  const fields: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name) }
  if (data.bio !== undefined) { fields.push("bio = ?"); values.push(data.bio) }
  if (data.neighborhood !== undefined) { fields.push("neighborhood = ?"); values.push(data.neighborhood) }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')")
    values.push(userId)
    database.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values)
  }

  return database.prepare("SELECT * FROM users WHERE id = ?").get(userId) as UserRecord
}
