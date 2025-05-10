import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '../[...nextauth]/route';
import { openDB } from 'idb';

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

// Find user in IndexedDB
async function findUser(email: string) {
  const db = await initUserDB();
  return db.get('users', email);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await findUser(email);
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Create user in IndexedDB
    await createUser(email, password);

    return NextResponse.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Error during signup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 