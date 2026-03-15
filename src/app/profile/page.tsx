"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Service {
  id: number
  title: string
  description: string | null
  price_podcoin: number
  category: string | null
  active: number
}

interface Profile {
  id: string
  name: string
  email: string
  bio: string
  neighborhood: string
  balance: number
  credit_limit: number
  image: string | null
  services: Service[]
}

const CATEGORIES = ["Tutoring", "Childcare", "Cooking", "Repair", "Music", "Fitness", "Tech", "Creative", "Transport", "Other"]

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: "", bio: "", neighborhood: "" })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [serviceForm, setServiceForm] = useState({ title: "", description: "", price_podcoin: "", category: "" })
  const [savingService, setSavingService] = useState(false)
  const [serviceError, setServiceError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  const loadProfile = async () => {
    const res = await fetch("/api/profile")
    const data = await res.json()
    setProfile(data)
    setProfileForm({ name: data.name, bio: data.bio ?? "", neighborhood: data.neighborhood ?? "" })
    setLoading(false)
  }

  useEffect(() => {
    if (session?.user) loadProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const saveProfile = async () => {
    setSavingProfile(true)
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    })
    setSavingProfile(false)
    setEditingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
    loadProfile()
  }

  const openServiceForm = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setServiceForm({
        title: service.title,
        description: service.description ?? "",
        price_podcoin: service.price_podcoin.toString(),
        category: service.category ?? "",
      })
    } else {
      setEditingService(null)
      setServiceForm({ title: "", description: "", price_podcoin: "", category: "" })
    }
    setServiceError("")
    setShowServiceForm(true)
  }

  const saveService = async () => {
    setServiceError("")
    if (!serviceForm.title.trim()) { setServiceError("Title is required"); return }
    if (!serviceForm.price_podcoin || isNaN(parseFloat(serviceForm.price_podcoin))) {
      setServiceError("Price must be a valid number"); return
    }
    setSavingService(true)

    const payload = {
      ...(editingService ? { id: editingService.id } : {}),
      title: serviceForm.title.trim(),
      description: serviceForm.description.trim() || undefined,
      price_podcoin: parseFloat(serviceForm.price_podcoin),
      category: serviceForm.category || undefined,
    }

    const res = await fetch("/api/services", {
      method: editingService ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setServiceError(data.error ?? "Failed to save service")
    } else {
      setShowServiceForm(false)
      loadProfile()
    }
    setSavingService(false)
  }

  const deleteService = async (id: number) => {
    if (!confirm("Delete this service?")) return
    await fetch(`/api/services?id=${id}`, { method: "DELETE" })
    loadProfile()
  }

  if (status === "loading" || loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-green-700 animate-pulse">Loading…</div></div>
  }
  if (!profile) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-green-900 mb-6">Profile & Settings</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6">
        <div className="flex items-start gap-4 mb-6">
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.image} alt="" className="w-16 h-16 rounded-full border-2 border-green-200" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
              {profile.name[0]}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <p className="text-sm text-gray-500">📍 {profile.neighborhood}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Balance</p>
            <p className={`text-xl font-bold ${profile.balance >= 0 ? "text-green-700" : "text-amber-600"}`}>
              ₱{profile.balance.toFixed(2)}
            </p>
          </div>
        </div>

        {editingProfile ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                rows={3}
                placeholder="Tell the community about yourself…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
              <input
                type="text"
                value={profileForm.neighborhood}
                onChange={(e) => setProfileForm({ ...profileForm, neighborhood: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditingProfile(false)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="flex-1 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:bg-gray-300"
              >
                {savingProfile ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {profile.bio && <p className="text-gray-600 text-sm mb-4">{profile.bio}</p>}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingProfile(true)}
                className="px-4 py-2 border border-green-200 text-green-700 rounded-lg text-sm hover:bg-green-50"
              >
                Edit Profile
              </button>
              {profileSaved && <span className="text-sm text-green-600">✓ Saved!</span>}
            </div>
          </div>
        )}
      </div>

      {/* Services */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-green-900">My Services</h2>
          <button
            onClick={() => openServiceForm()}
            className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800"
          >
            + Add Service
          </button>
        </div>

        {/* Service Form */}
        {showServiceForm && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4">
            <h3 className="font-medium text-green-800 mb-4">
              {editingService ? "Edit Service" : "New Service"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  placeholder="e.g. Guitar lessons"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  rows={2}
                  placeholder="Describe what you offer…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceForm.price_podcoin}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_podcoin: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              {serviceError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  {serviceError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowServiceForm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveService}
                  disabled={savingService}
                  className="flex-1 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:bg-gray-300"
                >
                  {savingService ? "Saving…" : editingService ? "Update" : "Add Service"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Services list */}
        {profile.services.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">🛠️</p>
            <p className="text-sm">You haven&apos;t listed any services yet.</p>
            <p className="text-xs mt-1">Add services to let neighbors know what you can offer!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.services.map((service) => (
              <div
                key={service.id}
                className={`border rounded-xl p-4 ${service.active ? "border-gray-100" : "border-gray-100 opacity-60"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800">{service.title}</p>
                      {!service.active && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">inactive</span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {service.category && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          {service.category}
                        </span>
                      )}
                      <span className="text-amber-600 font-semibold text-sm">₱{service.price_podcoin}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openServiceForm(service)}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteService(service.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
