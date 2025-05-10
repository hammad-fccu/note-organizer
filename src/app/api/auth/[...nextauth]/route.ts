import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { openDB } from 'idb';
import { User } from 'next-auth';

// Extend the User type to include id
interface ExtendedUser extends User {
  id: string;
}

// Initialize IndexedDB for user storage
async function initUserDB() {
  const db = await openDB('note-organizer-auth', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'email' });
        userStore.createIndex('email', 'email', { unique: true });
      }
    },
  });
  return db;
}

// Mock user creation - in production this would have proper security
async function createUser(email: string, password: string) {
  const db = await initUserDB();
  // Very basic password handling - NOT PRODUCTION READY
  // In a real app, you would use proper password hashing
  await db.put('users', { 
    email, 
    password, // In a real app, this would be hashed!
    name: email.split('@')[0],
    createdAt: new Date().toISOString()
  });
  return { email };
}

// Find user in IndexedDB
async function findUser(email: string) {
  const db = await initUserDB();
  return db.get('users', email);
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

        // Find user in IndexedDB
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
export { createUser }; 