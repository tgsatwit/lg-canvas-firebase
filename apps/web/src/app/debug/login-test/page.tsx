"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginTestPage() {
  const [email, setEmail] = useState('timothygillam@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const { signIn } = useAuth();

  const handleTestLogin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing login with:', email);
      await signIn(email, password);
      setResult('Login successful!');
    } catch (err) {
      console.error('❌ Login test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Login Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
        </div>
        
        <button
          onClick={handleTestLogin}
          disabled={loading || !email || !password}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {result && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Success:</strong> {result}
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-600">
          <p>This page tests the Firebase authentication without the full login UI.</p>
          <p>Check the browser console for detailed error messages.</p>
        </div>
      </div>
    </div>
  );
} 