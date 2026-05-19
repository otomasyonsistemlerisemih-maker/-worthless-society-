"use client";

import React, { useEffect, useState, useRef } from 'react';

interface DustParticle {
  x: number;
  y: number;
  z: number; // Depth factor: 0.1 (distant, blurry) to 1.0 (foreground, crisp)
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  angle: number;
  angleSpeed: number;
  amplitude: number;
}

const LiveEnvironmentSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const flashlightRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction coordinates
  const mousePos = useRef({ x: 0, y: 0 });
  const delayMousePos = useRef({ x: 0, y: 0 });
  const scrollOffset = useRef(0);
  const delayScrollOffset = useRef(0);

  // Instability states (shared across loops)
  const ambientFlicker = useRef(1.0); // 1.0 = normal, dims during flickers
  const currentDarkness = useRef(0.55); // Interpolated darkness base

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: DustParticle[] = [];
    const particleCount = 45; // Extremely minimal, elegant drift

    // Resizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Mouse & Scroll listeners
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
    };
    const handleScroll = () => {
      scrollOffset.current = window.scrollY;
    };
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.product-card')) {
        window.dispatchEvent(new CustomEvent('env-hover-resonance'));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mouseover', handleMouseOver);

    // Initialize Dust Particles
    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        const z = Math.random();
        const depth = 0.1 + z * 0.9; // 0.1 (distant) to 1.0 (foreground)
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: depth,
          size: 0.35 + depth * 0.9,
          opacity: 0.03 + depth * 0.13,
          vx: (Math.random() - 0.5) * 0.04 * depth,
          vy: -(0.03 + Math.random() * 0.06) * depth, // Slow upward drift
          angle: Math.random() * Math.PI * 2,
          angleSpeed: 0.0005 + Math.random() * 0.001,
          amplitude: 0.05 + Math.random() * 0.12,
        });
      }
    };
    initParticles();

    // Fluorescent lighting instability schedule (organic timeline)
    let nextFlickerTime = Date.now() + 8000 + Math.random() * 10000;
    let flickerActive = false;
    let flickerSteps = 0;

    // Core Animation loop uniting 12 subsystems
    const animate = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(animate);
        return;
      }

      const now = Date.now();

      // --- SUBSYSTEM 8 & 11: Fluorescent & Analog Instability ---
      if (now > nextFlickerTime && !flickerActive) {
        flickerActive = true;
        flickerSteps = Math.random() > 0.5 ? 4 : 2; // Subtle double-flicker or single
      }

      if (flickerActive) {
        if (flickerSteps > 0) {
          // Dim the light for one frame, recover on next
          const intensity = flickerSteps % 2 === 0 ? 0.35 : 0.95;
          ambientFlicker.current = intensity;
          flickerSteps--;

          // Dispatch event to sync Web Audio Hum crackle
          window.dispatchEvent(new CustomEvent('env-flicker', {
            detail: { intensity: 1.0 - intensity }
          }));
        } else {
          flickerActive = false;
          ambientFlicker.current = 1.0;
          nextFlickerTime = now + 12000 + Math.random() * 15000; // Schedule next instability

          window.dispatchEvent(new CustomEvent('env-flicker', {
            detail: { intensity: 0 }
          }));
        }
      } else {
        // Slow exposure breathing (Cinematic Respiration)
        const breathe = Math.sin(now * 0.0004) * 0.02;
        ambientFlicker.current = 1.0 + breathe;
      }

      // --- SUBSYSTEM 3 & 7: Sluggish Spotlight Shadows ---
      const ease = 0.018; // Cinematic latency
      delayMousePos.current.x += (mousePos.current.x - delayMousePos.current.x) * ease;
      delayMousePos.current.y += (mousePos.current.y - delayMousePos.current.y) * ease;
      delayScrollOffset.current += (scrollOffset.current - delayScrollOffset.current) * 0.05;

      const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;

      // Find active section based on viewport position
      let activeSectionId = 'home';
      const sectionsList = ['home', 'shop', 'manifesto', 'network', 'campaign'];
      for (const id of sectionsList) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5) {
            activeSectionId = id;
            break;
          }
        }
      }

      // Section-specific darkness overlay intensity (0.0 to 1.0)
      let targetDarkness = 0.55;
      if (activeSectionId === 'home') targetDarkness = 0.70;
      else if (activeSectionId === 'shop') targetDarkness = 0.42;
      else if (activeSectionId === 'manifesto') targetDarkness = 0.28;
      else if (activeSectionId === 'network') targetDarkness = 0.58;
      else if (activeSectionId === 'campaign') targetDarkness = 0.58;

      currentDarkness.current += (targetDarkness - currentDarkness.current) * 0.05;

      if (isMobile) {
        // Mobile behavior: soft center ambient reveal with safe visibility
        if (spotlightRef.current) {
          const staticDarkness = 0.45;
          const outerVal = Math.round(255 * (1 - staticDarkness));
          const midVal = Math.round(255 * (1 - staticDarkness * 0.4));
          spotlightRef.current.style.background = `radial-gradient(
            circle at center,
            rgba(255, 255, 255, 1) 0%,
            rgba(${midVal}, ${midVal}, ${midVal}, 1) 60%,
            rgba(${outerVal}, ${outerVal}, ${outerVal}, 1) 100%
          )`;
        }
        if (flashlightRef.current) {
          flashlightRef.current.style.background = 'none';
        }
      } else {
        // Desktop behavior: smooth flashlight following mouse
        const darkness = currentDarkness.current;
        const outerVal = Math.round(255 * (1 - darkness));
        const midVal = Math.round(255 * (1 - darkness * 0.4));

        if (spotlightRef.current) {
          // Multiply shadow layer with hole under cursor
          spotlightRef.current.style.background = `radial-gradient(
            circle 600px at ${delayMousePos.current.x}px ${delayMousePos.current.y}px,
            rgba(255, 255, 255, 1) 0%,
            rgba(${midVal}, ${midVal}, ${midVal}, 1) 45%,
            rgba(${outerVal}, ${outerVal}, ${outerVal}, ${ambientFlicker.current}) 100%
          )`;
        }

        if (flashlightRef.current) {
          // Soft radial screen light
          flashlightRef.current.style.background = `radial-gradient(
            circle 500px at ${delayMousePos.current.x}px ${delayMousePos.current.y}px,
            rgba(255, 255, 255, ${0.14 * ambientFlicker.current}) 0%,
            rgba(255, 255, 255, ${0.05 * ambientFlicker.current}) 45%,
            rgba(255, 255, 255, 0) 100%
          )`;
        }
      }

      // --- SUBSYSTEM 5: Parallax Depth System ---
      // Update global CSS custom properties for smooth parallax translations on site content
      const px = delayMousePos.current.x - window.innerWidth / 2;
      const py = delayMousePos.current.y - window.innerHeight / 2;
      document.documentElement.style.setProperty('--env-parallax-x', `${px * -0.015}px`);
      document.documentElement.style.setProperty('--env-parallax-y', `${py * -0.015 - delayScrollOffset.current * 0.02}px`);

      // --- SUBSYSTEM 1: Floating Dust System ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Particle position drift
        p.angle += p.angleSpeed;
        p.x += p.vx + Math.sin(p.angle) * p.amplitude;
        p.y += p.vy + Math.cos(p.angle * 0.5) * (p.amplitude * 0.5);

        // Wrap around margins
        if (p.x < -20) p.x = canvas.width + 20;
        else if (p.x > canvas.width + 20) p.x = -20;
        
        if (p.y < -20) p.y = canvas.height + 20;
        else if (p.y > canvas.height + 20) p.y = -20;

        // Sync dust opacity with the global light flicker
        const currentOpacity = p.opacity * ambientFlicker.current;

        // Render dust particles with camera blur depth
        if (p.z < 0.45) {
          // Out of focus distant particles (blurred bokeh)
          const radius = p.size * 2.3;
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
          gradient.addColorStop(0, `rgba(220, 220, 220, ${currentOpacity})`);
          gradient.addColorStop(0.3, `rgba(220, 220, 220, ${currentOpacity * 0.3})`);
          gradient.addColorStop(1, 'rgba(220, 220, 220, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Foreground particles (crisp tiny ash grains)
          ctx.fillStyle = `rgba(220, 220, 220, ${currentOpacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div ref={containerRef} className="live-environment-root">
      {/* Foreground Fine Film Grain (Creates the 3D Sandwich Effect with background grain) */}
      <div className="fg-grain" aria-hidden="true" />

      {/* Volumetric Fog Layer 1 - Drifts slowly */}
      <div className="volumetric-fog fog-layer-1" aria-hidden="true" />
      
      {/* Volumetric Fog Layer 2 - Drifts opposite direction */}
      <div className="volumetric-fog fog-layer-2" aria-hidden="true" />

      {/* Ambient Fluorescent Lighting Breathing and Instability */}
      <div className="fluorescent-instability" aria-hidden="true" />

      {/* Sluggish Spotlight Vignette with slow parallax cursor lag */}
      <div 
        ref={spotlightRef} 
        className="sluggish-spotlight" 
        aria-hidden="true" 
      />

      {/* Soft Cursor Flashlight Reveal Layer */}
      <div 
        ref={flashlightRef} 
        className="flashlight-reveal" 
        aria-hidden="true" 
      />

      {/* Floating Canvas Particle Layer */}
      <canvas
        ref={canvasRef}
        className="dust-canvas"
        aria-hidden="true"
      />

      <style jsx global>{`
        /* Global parallax offset applied to base content elements */
        body {
          background-color: var(--bg);
          color: var(--text-main);
          overflow-x: hidden;
        }

        /* Subtle thermal focus breathing/lens heat drift on main wrapper */
        .container, main, section {
          animation: lensThermalBreath 30s ease-in-out infinite alternate;
          transform: translate(var(--env-parallax-x, 0px), var(--env-parallax-y, 0px));
          transition: transform 0.8s cubic-bezier(0.25, 1, 0.3, 1);
          will-change: transform, filter;
        }

        @keyframes lensThermalBreath {
          0% { filter: blur(0px) contrast(1); }
          50% { filter: blur(0.15px) contrast(0.98); }
          100% { filter: blur(0px) contrast(1.01); }
        }

        /* Foreground fine grain */
        .fg-grain {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9998; /* Sits just underneath HUD but above content */
          opacity: 0.032;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 150 150' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter2)'/%3E%3C/svg%3E");
        }

        /* Volumetric Fog Base */
        .volumetric-fog {
          position: fixed;
          top: -20%;
          left: -20%;
          width: 140%;
          height: 140%;
          pointer-events: none;
          z-index: 1; /* Sits in front of background Three.js but behind grid cards */
          filter: blur(150px);
          opacity: 0.11;
          will-change: transform;
        }

        .fog-layer-1 {
          background: radial-gradient(
            circle at 25% 35%,
            rgba(55, 55, 55, 0.35) 0%,
            rgba(18, 18, 18, 0.08) 50%,
            rgba(0, 0, 0, 0) 80%
          );
          animation: driftFog1 120s linear infinite;
        }

        .fog-layer-2 {
          background: radial-gradient(
            circle at 75% 65%,
            rgba(45, 45, 45, 0.3) 0%,
            rgba(12, 12, 12, 0.06) 55%,
            rgba(0, 0, 0, 0) 85%
          );
          animation: driftFog2 150s linear infinite alternate;
        }

        @keyframes driftFog1 {
          0% { transform: rotate(0deg) translate(0px, 0px); }
          50% { transform: rotate(180deg) translate(40px, -20px); }
          100% { transform: rotate(360deg) translate(0px, 0px); }
        }

        @keyframes driftFog2 {
          0% { transform: rotate(180deg) translate(0px, 0px); }
          50% { transform: rotate(90deg) translate(-30px, 30px); }
          100% { transform: rotate(0deg) translate(0px, 0px); }
        }

        /* Fluorescent Lighting Instability */
        .fluorescent-instability {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 3;
          mix-blend-mode: soft-light;
          background: rgba(220, 230, 242, 0.02);
          animation: fluorescentBreathe 18s ease-in-out infinite;
        }

        @keyframes fluorescentBreathe {
          0%, 100% { 
            opacity: 0.28;
            background: rgba(220, 230, 242, 0.015);
          }
          48% {
            opacity: 0.32;
            background: rgba(220, 230, 242, 0.02);
          }
          50% {
            opacity: 0.12; /* Sudden micro flicker */
            background: rgba(220, 230, 242, 0.003);
          }
          51% {
            opacity: 0.38; /* Recovery glow */
            background: rgba(220, 230, 242, 0.024);
          }
          53% {
            opacity: 0.28;
            background: rgba(220, 230, 242, 0.015);
          }
          82% {
            opacity: 0.35;
            background: rgba(220, 230, 242, 0.021);
          }
        }

        /* Sluggish spotlight shadow layer */
        .sluggish-spotlight {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 3; /* Overlay shadow layer */
          mix-blend-mode: multiply;
          will-change: background;
        }

        /* Soft Cursor Flashlight Reveal Layer */
        .flashlight-reveal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 4; /* On top of shadow layer, below cursor */
          mix-blend-mode: screen;
          will-change: background;
        }

        /* Dust Canvas Layer */
        .dust-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2; /* Behind spotlight and fg grain, but over 3D background */
          opacity: 0.95;
        }

        /* Cinematic Depth of Field Focus Breathing on Products */
        .product-grid:hover .product-card:not(:hover) {
          filter: blur(1.5px) grayscale(0.85) brightness(0.55);
          opacity: 0.45;
          transform: scale(0.98);
        }

        .product-card {
          border: 1px solid rgba(255, 255, 255, 0.03);
          background: rgba(10, 10, 10, 0.35);
          padding: 0.75rem;
          transition: filter 1.2s cubic-bezier(0.25, 1, 0.3, 1), 
                      opacity 1.2s cubic-bezier(0.25, 1, 0.3, 1), 
                      transform 1.2s cubic-bezier(0.25, 1, 0.3, 1),
                      border-color 0.8s ease,
                      background-color 0.8s ease !important;
        }

        .product-card:hover {
          filter: blur(0px) grayscale(0.2) brightness(1.05);
          opacity: 1 !important;
          transform: scale(1.015) translateZ(10px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8);
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(15, 15, 15, 0.6);
        }
      `}</style>
    </div>
  );
};

export default LiveEnvironmentSystem;
