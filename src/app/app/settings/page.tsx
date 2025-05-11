'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  // User settings state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [darkModeSettings, setDarkModeSettings] = useState('system');
  const [displayName, setDisplayName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  
  // Status and feedback state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openRouterApiKey');
    if (!storedApiKey) {
      // Set default API key if none exists
      const defaultKey = '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';
      localStorage.setItem('openRouterApiKey', defaultKey);
      setOpenRouterApiKey(defaultKey);
    } else {
      setOpenRouterApiKey(storedApiKey);
    }
    
    const storedDarkMode = localStorage.getItem('darkMode') || 'system';
    setDarkModeSettings(storedDarkMode);
    
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [session]);
  
  // If not authenticated, redirect to sign in
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Check if still loading session
  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-blue-200 dark:bg-blue-800 mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  // Handle name update
  const handleNameUpdate = async () => {
    if (!displayName.trim()) {
      setError('Name cannot be empty');
      return;
    }
    
    setIsUpdatingName(true);
    setError('');
    setSuccess('');
    
    try {
      // In a real app, this would call an API endpoint to update the user name
      // For demonstration, we'll update the session using next-auth's update method
      await update({ name: displayName });
      
      setSuccess('Name updated successfully');
    } catch (err) {
      setError('Failed to update name. Please try again.');
      console.error(err);
    } finally {
      setIsUpdatingName(false);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset status
    setError('');
    setSuccess('');
    
    // Validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // This would be implemented with an actual API call
      // For demonstration, we'll just show a success message
      
      // Mock API call waiting time
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Failed to update password. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle API key save
  const handleApiKeySave = () => {
    localStorage.setItem('openRouterApiKey', openRouterApiKey);
    setSuccess('API key saved successfully');
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(''), 3000);
  };
  
  // Handle dark mode settings change
  const handleDarkModeChange = (mode: string) => {
    setDarkModeSettings(mode);
    localStorage.setItem('darkMode', mode);
    
    // Apply dark mode settings
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    setSuccess('Theme settings saved');
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/app"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="text"
              value={session?.user?.email || ''}
              disabled
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your email address cannot be changed
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <div className="flex">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your display name"
              />
              <button
                onClick={handleNameUpdate}
                disabled={isUpdatingName}
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isUpdatingName ? 'Saving...' : 'Save'}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This is how your name will appear in the application
            </p>
          </div>
        </div>
        
        {/* Change Password Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordChange}>
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={8}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={8}
              />
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
        
        {/* API Key Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">OpenRouter API Key</h2>
          
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={openRouterApiKey}
              onChange={(e) => setOpenRouterApiKey(e.target.value)}
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your OpenRouter API key"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This key is stored locally and used for AI features like summarization
            </p>
          </div>
          
          <button
            type="button"
            onClick={handleApiKeySave}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save API Key
          </button>
        </div>
        
        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          
          <div className="mb-4">
            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Theme Mode
            </p>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleDarkModeChange('light')}
                className={`flex-1 px-4 py-2 rounded-md border ${
                  darkModeSettings === 'light' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                }`}
              >
                Light
              </button>
              
              <button
                onClick={() => handleDarkModeChange('dark')}
                className={`flex-1 px-4 py-2 rounded-md border ${
                  darkModeSettings === 'dark' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                }`}
              >
                Dark
              </button>
              
              <button
                onClick={() => handleDarkModeChange('system')}
                className={`flex-1 px-4 py-2 rounded-md border ${
                  darkModeSettings === 'system' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                }`}
              >
                System
              </button>
            </div>
            
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Choose your preferred theme mode
            </p>
          </div>
        </div>
        
        {/* Account Deletion Section */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Danger Zone</h2>
          
          <div className="border border-red-300 dark:border-red-800 rounded-md p-4">
            <h3 className="font-medium mb-2">Delete Account</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
            </p>
            
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              onClick={() => {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  // This would call an API to delete the account in a real app
                  alert('Account deletion would be processed here in a real application');
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 