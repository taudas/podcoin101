"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  neighborhood: string
  balance: number
  services: { id: number; title: string; price_podcoin: number }[]
}

export default function TransferPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [selected, setSelected] = useState<User | null>(null)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<{ fromBalance: number } | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!session?.user) return
      setSearching(true)
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`)
        const data = await res.json()
        setUsers((data.users ?? []).filter((u: User) => u.id !== session.user?.id))
      } catch (err) {
        console.error("User search failed:", err)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !amount) return
    setError("")
    setSubmitting(true)

    const res = await fetch("/api/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUserId: selected.id,
        amount: parseFloat(amount),
        note,
      }),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error ?? "Transfer failed")
    } else {
      setSuccess({ fromBalance: data.fromBalance })
    }
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-green-700 animate-pulse">Loading…</div></div>
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Transfer Sent!</h2>
        <p className="text-gray-600 mb-1">
          ₱{parseFloat(amount).toFixed(2)} sent to {selected?.name}
        </p>
        {note && <p className="text-gray-400 text-sm mb-4">&ldquo;{note}&rdquo;</p>}
        <p className="text-sm text-gray-500 mb-6">Your new balance: ₱{success.fromBalance.toFixed(2)}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSuccess(null); setSelected(null); setAmount(""); setNote("") }}
            className="px-5 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
          >
            Send Again
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2 border border-green-700 text-green-700 rounded-lg hover:bg-green-50"
          >
            Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-green-900 mb-6">Send Podcoin</h1>

      {/* Recipient search */}
      {!selected ? (
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-4">
          <h2 className="font-semibold text-gray-700 mb-3">Find Recipient</h2>
          <input
            type="text"
            placeholder="Search by name or service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
          />
          {searching && <p className="text-gray-400 text-sm">Searching…</p>}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelected(user)}
                className="w-full text-left p-3 rounded-lg hover:bg-green-50 border border-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-800">{user.name}</div>
                <div className="text-xs text-gray-400">{user.neighborhood}</div>
                {user.services.length > 0 && (
                  <div className="text-xs text-green-600 mt-1">
                    {user.services.slice(0, 2).map((s) => s.title).join(", ")}
                    {user.services.length > 2 && ` +${user.services.length - 2} more`}
                  </div>
                )}
              </button>
            ))}
            {!searching && users.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No users found</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Sending to</p>
              <p className="font-semibold text-gray-800 text-lg">{selected.name}</p>
              <p className="text-xs text-gray-400">{selected.neighborhood}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Change
            </button>
          </div>

          {/* Service quick-select */}
          {selected.services.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Quick-select service:</p>
              <div className="flex flex-wrap gap-2">
                {selected.services.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setAmount(s.price_podcoin.toString()); setNote(s.title) }}
                    className="text-xs px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full hover:bg-green-100"
                  >
                    {s.title} — ₱{s.price_podcoin}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's this for?"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !amount}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {submitting ? "Sending…" : `Send ₱${amount || "0"} to ${selected.name}`}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
