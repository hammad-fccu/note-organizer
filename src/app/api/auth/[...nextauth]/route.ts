import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { User } from 'next-auth';
import { findUser } from '@/lib/auth';

// Extend the User type to include id
interface ExtendedUser extends User {
  id: string;
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user
        const user = await findUser(credentials.email);
        
        // Check if user exists and password matches
        // NOTE: In a real application, you should use proper password hashing
        if (user && user.password === credentials.password) {
          return { 
            id: user.email,
            email: user.email,
            name: user.name,
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    // NextAuth doesn't have a built-in signup page option, we'll handle this separately
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Type assertion to handle the extended user type
        (session.user as ExtendedUser).id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});

// Export auth API handlers
export { handler as GET, handler as POST }; 