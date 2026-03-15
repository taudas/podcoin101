import type { Metadata } from "next"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import Navbar from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Podcoin Exchange",
  description: "Alameda's Community Currency — mutual credit for neighbors",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <SessionProvider>
          <Navbar />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  )
}
