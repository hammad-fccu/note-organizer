import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { User } from 'next-auth';

// Extend the User type to include id
interface ExtendedUser extends User {
  id: string;
}

// Simple in-memory user store (for demo purposes only)
// In a real app, this would be a database
const users: Record<string, { email: string; password: string; name: string; createdAt: string }> = {
  // Add a test user that's always available
  'test@example.com': {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    createdAt: new Date().toISOString()
  }
};

// Mock user creation - in production this would have proper security
async function createUser(email: string, password: string) {
  // Very basic password handling - NOT PRODUCTION READY
  // In a real app, you would use proper password hashing
  users[email] = { 
    email, 
    password, // In a real app, this would be hashed!
    name: email.split('@')[0],
    createdAt: new Date().toISOString()
  };
  return { email };
}

// Find user
async function findUser(email: string) {
  return users[email];
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

// Export user creation function for signup
export { createUser, findUser }; 