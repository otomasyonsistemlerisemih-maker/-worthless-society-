"use client";

import React, { useState } from 'react';

const SecretPage = () => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setIsAuthorized(true);
      setError('');
    } else {
      setError('ACCESS DENIED. INCORRECT KEY.');
    }
  };

  if (isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-6xl font-bold tracking-tighter mb-8">THE INNER CIRCLE</h1>
        <p className="text-white/50 max-w-md text-center leading-relaxed">
          Welcome to the shadows. This is where the exclusive drops and silent messages reside.
          Currently, the society is preparing for the next silence.
        </p>
        <div className="mt-12 p-12 border border-white/10 bg-white/5 backdrop-blur-sm">
          <p className="text-[10px] tracking-[0.5em] text-accent">COMING SOON</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-8">
      <div className="max-w-md w-full">
        <h2 className="text-[10px] tracking-[0.5em] text-white/30 uppercase mb-8 text-center">Identity Verification Required</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ENTER ACCESS KEY"
            className="w-full bg-transparent border-b border-white/20 p-4 text-center focus:outline-none focus:border-white transition-colors tracking-widest uppercase placeholder:text-white/10"
          />
          <button 
            type="submit"
            className="w-full p-4 border border-white/10 hover:bg-white hover:text-black transition-all duration-500 text-[10px] tracking-[0.5em] uppercase"
          >
            Authenticate
          </button>
        </form>
        {error && <p className="mt-4 text-[10px] text-accent text-center tracking-widest">{error}</p>}
      </div>
    </div>
  );
};

export default SecretPage;
