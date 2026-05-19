"use client";

import React, { useEffect, useRef } from 'react';

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
  const overlayRef = useRef<HTMLDivElement | null>(null);
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
    // Media / User Preference Detections
    const isMobileDevice = () => {
      return window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
    };
    
    const prefersReducedMotion = () => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    const skipInteractions = isMobileDevice() || prefersReducedMotion();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: DustParticle[] = [];
    
    // Completely disable dust particles on low-power devices/reduced motion to save CPU/GPU cycles
    const particleCount = skipInteractions ? 0 : 35;

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

    if (!skipInteractions) {
      // Set initial mouse variables to center so flashlight begins focused
      document.documentElement.style.setProperty('--mouse-x', `${window.innerWidth / 2}px`);
      document.documentElement.style.setProperty('--mouse-y', `${window.innerHeight / 2}px`);
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mouseover', handleMouseOver);

    // Initialize Dust Particles
    const initParticles = () => {
      particles = [];
      if (skipInteractions) return;
      for (let i = 0; i < particleCount; i++) {
        const z = Math.random();
        const depth = 0.1 + z * 0.9;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: depth,
          size: 0.35 + depth * 0.8,
          opacity: 0.02 + depth * 0.12,
          vx: (Math.random() - 0.5) * 0.03 * depth,
          vy: -(0.02 + Math.random() * 0.05) * depth, // Slow upward drift
          angle: Math.random() * Math.PI * 2,
          angleSpeed: 0.0004 + Math.random() * 0.0008,
          amplitude: 0.04 + Math.random() * 0.1,
        });
      }
    };
    initParticles();

    // Fluorescent lighting instability schedule (organic timeline)
    let nextFlickerTime = Date.now() + 8000 + Math.random() * 10000;
    let flickerActive = false;
    let flickerSteps = 0;

    // Core Animation loop
    const animate = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(animate);
        return;
      }

      const now = Date.now();

      // Flicker Instability System
      if (now > nextFlickerTime && !flickerActive && !prefersReducedMotion()) {
        flickerActive = true;
        flickerSteps = Math.random() > 0.5 ? 4 : 2;
      }

      if (flickerActive) {
        if (flickerSteps > 0) {
          const intensity = flickerSteps % 2 === 0 ? 0.45 : 0.95;
          ambientFlicker.current = intensity;
          flickerSteps--;

          window.dispatchEvent(new CustomEvent('env-flicker', {
            detail: { intensity: 1.0 - intensity }
          }));
        } else {
          flickerActive = false;
          ambientFlicker.current = 1.0;
          nextFlickerTime = now + 14000 + Math.random() * 15000;

          window.dispatchEvent(new CustomEvent('env-flicker', {
            detail: { intensity: 0 }
          }));
        }
      } else {
        // Slow exposure breathing
        const breathe = Math.sin(now * 0.0003) * 0.015;
        ambientFlicker.current = 1.0 + breathe;
      }

      // Smooth latency easing
      if (!skipInteractions) {
        const ease = 0.06; // Eased cursor lag for cinematic float
        delayMousePos.current.x += (mousePos.current.x - delayMousePos.current.x) * ease;
        delayMousePos.current.y += (mousePos.current.y - delayMousePos.current.y) * ease;
      }
      delayScrollOffset.current += (scrollOffset.current - delayScrollOffset.current) * 0.05;

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
      else if (activeSectionId === 'shop') targetDarkness = 0.40;
      else if (activeSectionId === 'manifesto') targetDarkness = 0.20; // High readability
      else if (activeSectionId === 'network') targetDarkness = 0.50;
      else if (activeSectionId === 'campaign') targetDarkness = 0.50;

      currentDarkness.current += (targetDarkness - currentDarkness.current) * 0.05;

      // Update CSS variables directly on root document element (zero React re-renders)
      const root = document.documentElement;
      if (!skipInteractions) {
        root.style.setProperty('--mouse-x', `${delayMousePos.current.x}px`);
        root.style.setProperty('--mouse-y', `${delayMousePos.current.y}px`);
        
        const px = delayMousePos.current.x - window.innerWidth / 2;
        const py = delayMousePos.current.y - window.innerHeight / 2;
        root.style.setProperty('--env-parallax-x', `${px * -0.015}px`);
        root.style.setProperty('--env-parallax-y', `${py * -0.015 - delayScrollOffset.current * 0.02}px`);
      } else {
        root.style.setProperty('--env-parallax-x', '0px');
        root.style.setProperty('--env-parallax-y', `${-delayScrollOffset.current * 0.02}px`);
      }
      root.style.setProperty('--darkness-level', (currentDarkness.current * ambientFlicker.current).toFixed(3));

      // Floating dust particle canvas updates
      if (!skipInteractions && particles.length > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Particle position drift
          p.angle += p.angleSpeed;
          p.x += p.vx + Math.sin(p.angle) * p.amplitude;
          p.y += p.vy + Math.cos(p.angle * 0.5) * (p.amplitude * 0.5);

          // Wrap around edges
          if (p.x < -20) p.x = canvas.width + 20;
          else if (p.x > canvas.width + 20) p.x = -20;
          
          if (p.y < -20) p.y = canvas.height + 20;
          else if (p.y > canvas.height + 20) p.y = -20;

          // Sync dust opacity with the global light flicker
          const currentOpacity = p.opacity * ambientFlicker.current;

          // Render dust particles with camera blur depth (bokeh vs crisp)
          if (p.z < 0.45) {
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
            ctx.fillStyle = `rgba(220, 220, 220, ${currentOpacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (particles.length > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      {/* Foreground Fine Film Grain */}
      <div className="fg-grain" aria-hidden="true" />

      {/* Volumetric Fog Layer 1 - Drifts slowly */}
      <div className="volumetric-fog fog-layer-1" aria-hidden="true" />
      
      {/* Volumetric Fog Layer 2 - Drifts opposite direction */}
      <div className="volumetric-fog fog-layer-2" aria-hidden="true" />

      {/* Ambient Fluorescent Lighting Breathing and Instability */}
      <div className="fluorescent-instability" aria-hidden="true" />

      {/* Single Performance-Optimized Atmosphere Overlay */}
      <div 
        ref={overlayRef} 
        className="atmosphere-overlay" 
        aria-hidden="true" 
      />

      {/* Floating Canvas Particle Layer */}
      <canvas
        ref={canvasRef}
        className="dust-canvas"
        aria-hidden="true"
      />

      <style jsx global>{`
        body {
          background-color: var(--bg);
          color: var(--text-main);
          overflow-x: hidden;
        }

        .container, main, section {
          transform: translate(var(--env-parallax-x, 0px), var(--env-parallax-y, 0px));
          transition: transform 0.8s cubic-bezier(0.25, 1, 0.3, 1);
          will-change: transform;
        }

        /* Foreground fine grain */
        .fg-grain {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9998;
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
          z-index: 1;
          filter: blur(120px);
          opacity: 0.09;
          will-change: transform;
        }

        .fog-layer-1 {
          background: radial-gradient(
            circle at 25% 35%,
            rgba(55, 55, 55, 0.3) 0%,
            rgba(18, 18, 18, 0.05) 50%,
            rgba(0, 0, 0, 0) 80%
          );
          animation: driftFog1 140s linear infinite;
        }

        .fog-layer-2 {
          background: radial-gradient(
            circle at 75% 65%,
            rgba(45, 45, 45, 0.25) 0%,
            rgba(12, 12, 12, 0.04) 55%,
            rgba(0, 0, 0, 0) 85%
          );
          animation: driftFog2 170s linear infinite alternate;
        }

        @keyframes driftFog1 {
          0% { transform: rotate(0deg) translate(0px, 0px); }
          50% { transform: rotate(180deg) translate(30px, -15px); }
          100% { transform: rotate(360deg) translate(0px, 0px); }
        }

        @keyframes driftFog2 {
          0% { transform: rotate(180deg) translate(0px, 0px); }
          50% { transform: rotate(90deg) translate(-20px, 20px); }
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
          background: rgba(220, 230, 242, 0.015);
          animation: fluorescentBreathe 20s ease-in-out infinite;
        }

        @keyframes fluorescentBreathe {
          0%, 100% { 
            opacity: 0.24;
            background: rgba(220, 230, 242, 0.01);
          }
          48% {
            opacity: 0.28;
            background: rgba(220, 230, 242, 0.015);
          }
          50% {
            opacity: 0.08;
            background: rgba(220, 230, 242, 0.002);
          }
          51% {
            opacity: 0.32;
            background: rgba(220, 230, 242, 0.02);
          }
          53% {
            opacity: 0.24;
            background: rgba(220, 230, 242, 0.01);
          }
          82% {
            opacity: 0.3;
            background: rgba(220, 230, 242, 0.016);
          }
        }

        /* Single fixed overlay: Radial spotlight & flashlight */
        .atmosphere-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9997; /* Sits above main content but below custom cursor & modals */
          background: radial-gradient(
            circle 380px at var(--mouse-x, 50vw) var(--mouse-y, 50vh),
            rgba(255, 255, 255, 0.12) 0%,
            rgba(255, 255, 255, 0.06) 28%,
            rgba(255, 255, 255, 0.01) 55%,
            rgba(0, 0, 0, var(--darkness-level, 0.55)) 100%
          );
          will-change: background;
        }

        /* Responsive & motion preferences: Static central atmosphere to maximize rendering speed */
        @media (max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce) {
          .atmosphere-overlay {
            background: radial-gradient(
              circle at center,
              rgba(255, 255, 255, 0.06) 0%,
              rgba(0, 0, 0, var(--darkness-level, 0.55)) 100%
            ) !important;
          }
          .volumetric-fog, .fluorescent-instability {
            animation: none !important;
          }
          .container, main, section {
            animation: none !important;
            transform: none !important;
          }
        }

        /* Dust Canvas Layer */
        .dust-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
          opacity: 0.95;
        }

        /* Performance-optimized product focus system */
        .product-grid:hover .product-card:not(:hover) {
          filter: grayscale(0.6) brightness(0.65);
          opacity: 0.6;
          transform: scale(0.985);
        }

        .product-card {
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(14, 14, 14, 0.65);
          padding: 0.75rem;
          transition: filter 0.8s cubic-bezier(0.25, 1, 0.3, 1), 
                      opacity 0.8s cubic-bezier(0.25, 1, 0.3, 1), 
                      transform 0.8s cubic-bezier(0.25, 1, 0.3, 1),
                      border-color 0.6s ease,
                      background-color 0.6s ease !important;
        }

        .product-card:hover {
          filter: grayscale(0.1) brightness(1.1);
          opacity: 1 !important;
          transform: scale(1.01) translateZ(5px);
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(20, 20, 20, 0.8);
        }
      `}</style>
    </div>
  );
};

export default LiveEnvironmentSystem;
