import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { getOrCreateUser } from "./lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.id || !user.email) return false
      await getOrCreateUser({
        id: user.id,
        name: user.name ?? user.email,
        email: user.email,
        image: user.image ?? null,
      })
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "development-secret-change-in-production",
})
