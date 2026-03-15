"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface BalanceData {
  balance: number
  credit_limit: number
  available_credit: number
}

interface Transaction {
  id: number
  from_user_id: string | null
  to_user_id: string | null
  amount: number
  note: string
  type: string
  created_at: string
  from_name: string | null
  to_name: string | null
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  useEffect(() => {
    if (!session?.user) return
    Promise.all([
      fetch("/api/balance").then((r) => r.json()),
      fetch("/api/transactions").then((r) => r.json()),
    ]).then(([bal, txns]) => {
      setBalanceData(bal)
      setTransactions((txns.transactions ?? []).slice(0, 10))
      setLoading(false)
    })
  }, [session])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-green-700 text-lg animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!session?.user || !balanceData) return null

  const balance = balanceData.balance
  const pct = ((balance + balanceData.credit_limit) / (2 * balanceData.credit_limit)) * 100
  const balanceColor =
    balance >= 0
      ? "text-green-700"
      : balance >= -balanceData.credit_limit * 0.8
      ? "text-amber-600"
      : "text-red-600"
  const barColor =
    balance >= 0
      ? "bg-green-500"
      : balance >= -balanceData.credit_limit * 0.8
      ? "bg-amber-400"
      : "bg-red-500"

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-green-900 mb-6">
        Welcome back, {session.user.name?.split(" ")[0]}!
      </h1>

      {/* Balance Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Balance</p>
            <p className={`text-4xl font-bold ${balanceColor}`}>
              ₱{balance.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Available Credit</p>
            <p className="text-xl font-semibold text-gray-700">
              ₱{balanceData.available_credit.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Credit bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>-₱{balanceData.credit_limit}</span>
            <span>₱0</span>
            <span>∞</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(Math.max(pct, 2), 100)}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">Credit limit: ₱{balanceData.credit_limit}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Link
          href="/transfer"
          className="flex flex-col items-center gap-2 bg-green-700 hover:bg-green-800 text-white rounded-xl p-4 transition-colors"
        >
          <span className="text-2xl">💸</span>
          <span className="text-sm font-medium">Send</span>
        </Link>
        <Link
          href="/qr"
          className="flex flex-col items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl p-4 transition-colors"
        >
          <span className="text-2xl">📱</span>
          <span className="text-sm font-medium">QR Pay</span>
        </Link>
        <Link
          href="/directory"
          className="flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 transition-colors"
        >
          <span className="text-2xl">🗺️</span>
          <span className="text-sm font-medium">Directory</span>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-green-900">Recent Activity</h2>
          <Link href="/transfer" className="text-sm text-green-600 hover:text-green-800">
            Send →
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">💰</p>
            <p>No transactions yet. Start trading!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => {
              const isSent = tx.from_user_id === session.user?.id
              const counterpart = isSent ? tx.to_name : tx.from_name
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isSent ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                      {isSent ? "↑" : "↓"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {isSent ? `To ${counterpart}` : `From ${counterpart}`}
                      </p>
                      {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
                      <p className="text-xs text-gray-300">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${isSent ? "text-red-600" : "text-green-700"}`}>
                    {isSent ? "-" : "+"}₱{tx.amount.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
