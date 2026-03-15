"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Service {
  id: number
  title: string
  price_podcoin: number
  category: string | null
  description: string | null
}

interface User {
  id: string
  name: string
  neighborhood: string
  bio: string
  image: string | null
  services: Service[]
}

export default function DirectoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<User | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  useEffect(() => {
    if (!session?.user) return
    const timer = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setUsers(data.users ?? [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, session])

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-green-700 animate-pulse">Loading…</div></div>
  }

  if (selected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-6 text-sm"
        >
          ← Back to Directory
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
          <div className="flex items-start gap-4 mb-6">
            {selected.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.image} alt="" className="w-16 h-16 rounded-full border-2 border-green-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
                {selected.name[0]}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
              <p className="text-sm text-gray-500">📍 {selected.neighborhood}</p>
              {selected.bio && <p className="text-sm text-gray-600 mt-2">{selected.bio}</p>}
            </div>
          </div>

          {selected.services.length > 0 ? (
            <div>
              <h3 className="font-semibold text-green-900 mb-3">Services Offered</h3>
              <div className="space-y-3">
                {selected.services.map((s) => (
                  <div key={s.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{s.title}</p>
                        {s.description && <p className="text-sm text-gray-500 mt-1">{s.description}</p>}
                        {s.category && (
                          <span className="inline-block mt-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            {s.category}
                          </span>
                        )}
                      </div>
                      <span className="text-amber-600 font-semibold ml-4 whitespace-nowrap">₱{s.price_podcoin}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No services listed yet.</p>
          )}

          {selected.id !== session?.user?.id && (
            <div className="mt-6">
              <Link
                href={`/transfer?to=${selected.id}`}
                className="block w-full text-center bg-green-700 text-white font-semibold py-3 rounded-lg hover:bg-green-800 transition-colors"
              >
                Send Podcoin to {selected.name.split(" ")[0]}
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">Community Directory</h1>
        <span className="text-sm text-gray-400">{users.length} neighbors</span>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search by name, service, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <span className="absolute left-3 top-3 text-gray-400">🔍</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 animate-pulse">Loading directory…</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🏘️</p>
          <p>No neighbors found{search ? ` matching "${search}"` : ""}.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelected(user)}
              className="bg-white rounded-xl shadow-sm border border-green-100 p-5 text-left hover:shadow-md hover:border-green-300 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="w-10 h-10 rounded-full border border-green-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">
                    {user.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-400">📍 {user.neighborhood}</p>
                </div>
              </div>
              {user.services.length > 0 ? (
                <div className="space-y-1">
                  {user.services.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate mr-2">{s.title}</span>
                      <span className="text-amber-600 font-medium whitespace-nowrap">₱{s.price_podcoin}</span>
                    </div>
                  ))}
                  {user.services.length > 3 && (
                    <p className="text-xs text-gray-400">+{user.services.length - 3} more</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No services listed</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
