"use client";

import React from 'react';
import { useAudio } from '@/context/AudioContext';

const SoundToggle: React.FC = () => {
  const { soundOn, isInitialized, toggleSound } = useAudio();

  if (!isInitialized) return null;

  const handleMouseEnter = () => {
    document.querySelector('.cursor-follower')?.classList.add('active');
  };

  const handleMouseLeave = () => {
    document.querySelector('.cursor-follower')?.classList.remove('active');
  };

  return (
    <button
      className="sound-toggle-btn"
      onClick={toggleSound}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      SOUND: {soundOn ? 'ON' : 'OFF'}
    </button>
  );
};

export default SoundToggle;
