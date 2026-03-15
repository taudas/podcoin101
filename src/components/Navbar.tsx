"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"

export default function Navbar() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetch("/api/balance")
        .then((r) => r.json())
        .then((d) => {
          if (typeof d.balance === "number") setBalance(d.balance)
        })
        .catch(() => {})
    }
  }, [session])

  if (!session?.user) return null

  return (
    <nav className="bg-green-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-amber-400">
            <span className="text-2xl">₱</span>
            <span>Podcoin</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-amber-400 transition-colors text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/transfer" className="hover:text-amber-400 transition-colors text-sm font-medium">
              Transfer
            </Link>
            <Link href="/directory" className="hover:text-amber-400 transition-colors text-sm font-medium">
              Directory
            </Link>
            <Link href="/qr" className="hover:text-amber-400 transition-colors text-sm font-medium">
              QR Pay
            </Link>
          </div>

          {/* Balance + User */}
          <div className="hidden md:flex items-center gap-4">
            {balance !== null && (
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${balance >= 0 ? "bg-green-700 text-green-100" : "bg-amber-700 text-amber-100"}`}>
                ₱{balance.toFixed(2)}
              </span>
            )}
            <Link href="/profile" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full border-2 border-green-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-sm font-bold">
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <span className="text-sm">{session.user.name}</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-green-300 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-0.5 bg-white mb-1" />
            <div className="w-6 h-0.5 bg-white mb-1" />
            <div className="w-6 h-0.5 bg-white" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-green-800 px-4 py-3 flex flex-col gap-3 border-t border-green-700">
          {balance !== null && (
            <div className={`text-sm font-semibold px-3 py-1 rounded-full text-center ${balance >= 0 ? "bg-green-700" : "bg-amber-700"}`}>
              Balance: ₱{balance.toFixed(2)}
            </div>
          )}
          <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="hover:text-amber-400 transition-colors">Dashboard</Link>
          <Link href="/transfer" onClick={() => setMenuOpen(false)} className="hover:text-amber-400 transition-colors">Transfer</Link>
          <Link href="/directory" onClick={() => setMenuOpen(false)} className="hover:text-amber-400 transition-colors">Directory</Link>
          <Link href="/qr" onClick={() => setMenuOpen(false)} className="hover:text-amber-400 transition-colors">QR Pay</Link>
          <Link href="/profile" onClick={() => setMenuOpen(false)} className="hover:text-amber-400 transition-colors">Profile</Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-left text-green-300 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
