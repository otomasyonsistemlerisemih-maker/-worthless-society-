"use client";

import React, { useEffect, useRef, useState } from 'react';

interface EnterArchiveIntroProps {
  isActive: boolean;
  onComplete: () => void;
}

export default function EnterArchiveIntro({ isActive, onComplete }: EnterArchiveIntroProps) {
  const [shouldPlay, setShouldPlay] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check if user has seen intro and if they prefer reduced motion
    const hasSeen = localStorage.getItem('worthless_intro_seen');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!hasSeen && !prefersReducedMotion) {
      setShouldPlay(true);
    } else {
      setShouldPlay(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      if (!shouldPlay) {
        // Skip entirely if seen before or prefers reduced motion
        onComplete();
      } else {
        // Play video
        if (videoRef.current) {
          videoRef.current.play().catch((e) => {
            console.error("Video play failed:", e);
            handleSkip(); // Fallback if video fails to play
          });
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, shouldPlay]);

  const handleSkip = () => {
    if (hasFinished) return;
    setHasFinished(true);
    localStorage.setItem('worthless_intro_seen', 'true');
    setIsFadingOut(true);
    
    // Stop video
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  if (!shouldPlay && !isActive) return null;
  if (!isActive) return null;
  if (hasFinished && isFadingOut === false) return null;

  return (
    <div className={`enter-archive-intro ${isFadingOut ? 'fade-out' : 'fade-in'}`}>
      <video
        ref={videoRef}
        className="intro-video"
        src="/videos/enter-archive.mp4"
        playsInline
        muted
        onEnded={handleSkip}
        onError={handleSkip}
      />
      <button className="intro-skip-btn" onClick={handleSkip}>SKIP</button>
    </div>
  );
}
