import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('1️⃣ Sending login request to backend...')
          
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password
            })
          })

          console.log('2️⃣ Backend response status:', res.status)
          const data = await res.json()
          console.log('3️⃣ Backend response data:', JSON.stringify(data, null, 2))

          if (!res.ok) {
            console.error('❌ Backend error:', data.message)
            throw new Error(data.message || 'Authentication failed')
          }

          // 🟢 CRITICAL: Extract user from your backend's response structure
          // Your backend returns: { success: true, token: "...", data: { user: {...} } }
          const user = data.data?.user || data.user
          const token = data.token

          if (user && token) {
            console.log('4️⃣ User authenticated successfully:', user.email)
            return {
              id: user.id || user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              token: token
            }
          }

          console.error('❌ No user or token in response')
          return null
        } catch (error) {
          console.error('❌ Authorize error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.token = user.token
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        role: token.role,
        token: token.token
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true // Enable debug mode
})

export { handler as GET, handler as POST }