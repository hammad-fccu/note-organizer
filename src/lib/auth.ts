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
export async function createUser(email: string, password: string) {
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
export async function findUser(email: string) {
  return users[email];
} 