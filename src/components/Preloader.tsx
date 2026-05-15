"use client";

import React, { useState, useEffect } from 'react';

const Preloader: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black transition-opacity duration-1000">
      <div className="w-64 h-[1px] bg-white/20 relative overflow-hidden mb-4">
        <div 
          className="absolute top-0 left-0 h-full bg-white transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-[10px] tracking-[0.5em] text-white/50 uppercase font-light">
        INITIALIZING SYSTEM {progress}%
      </div>
      <div className="absolute bottom-10 text-[8px] tracking-[0.2em] text-white/20 uppercase font-light">
        Worthless Society © 2026
      </div>
    </div>
  );
};

export default Preloader;
