import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { signIn } from "@/auth"

export default async function Home() {
  const session = await auth()
  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800 text-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="text-6xl mb-4">₱</div>
        <h1 className="text-5xl font-bold mb-4 text-amber-400">Podcoin Exchange</h1>
        <p className="text-xl text-green-200 mb-2">Alameda&apos;s Community Currency</p>
        <p className="text-green-300 max-w-2xl mx-auto mb-10">
          A mutual credit system where neighbors help neighbors. Trade services,
          earn Podcoin, and build a stronger local economy — no bank required.
        </p>

        {/* Sign in */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/dashboard" })
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors w-full sm:w-auto"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign in with GitHub
            </button>
          </form>
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-semibold px-6 py-3 rounded-lg transition-colors w-full sm:w-auto"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: "🤝",
            title: "Mutual Credit",
            desc: "Start at zero. Earn by giving, spend by receiving. ₱500 credit available.",
          },
          {
            icon: "⚡",
            title: "Instant Transfers",
            desc: "Send Podcoin to any neighbor in seconds — no fees, no delays.",
          },
          {
            icon: "📱",
            title: "QR Payments",
            desc: "Generate your personal QR code to receive. Scan to pay instantly.",
          },
          {
            icon: "🗺️",
            title: "Local Directory",
            desc: "Browse services offered by Alameda neighbors. Find what you need.",
          },
        ].map((f) => (
          <div key={f.title} className="bg-green-800/50 border border-green-700 rounded-xl p-6">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-amber-400 mb-2">{f.title}</h3>
            <p className="text-green-300 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
