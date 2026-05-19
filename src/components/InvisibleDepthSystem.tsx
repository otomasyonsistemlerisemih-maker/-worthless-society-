"use client";

import React, { useEffect, useState, useRef } from 'react';

const InvisibleDepthSystem: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const delayMousePos = useRef({ x: 0, y: 0 });
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Handle mouse movement for slow parallax spotlight and shadows
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Ultra-slow lag simulation for sluggish lighting latency
    let animId: number;
    const updateSpotlight = () => {
      const ease = 0.02; // Very slow lag
      delayMousePos.current.x += (mousePos.x - delayMousePos.current.x) * ease;
      delayMousePos.current.y += (mousePos.y - delayMousePos.current.y) * ease;

      if (spotlightRef.current) {
        spotlightRef.current.style.background = `radial-gradient(
          circle 600px at ${delayMousePos.current.x}px ${delayMousePos.current.y}px,
          rgba(30, 30, 30, 0.08) 0%,
          rgba(10, 10, 10, 0.4) 50%,
          rgba(3, 3, 3, 0.92) 100%
        )`;
      }

      animId = requestAnimationFrame(updateSpotlight);
    };
    updateSpotlight();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [mousePos]);

  return (
    <>
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

      <style jsx global>{`
        /* Foreground fine grain */
        .fg-grain {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9998; /* Sits just underneath HUD overlays but above text content */
          opacity: 0.035;
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
          z-index: 1; /* Behind text content but in front of Three.js canvas */
          filter: blur(150px);
          opacity: 0.12;
          will-change: transform;
        }

        .fog-layer-1 {
          background: radial-gradient(
            circle at 30% 40%,
            rgba(60, 60, 60, 0.4) 0%,
            rgba(20, 20, 20, 0.1) 40%,
            rgba(0, 0, 0, 0) 70%
          );
          animation: driftFog1 110s linear infinite;
        }

        .fog-layer-2 {
          background: radial-gradient(
            circle at 70% 60%,
            rgba(50, 50, 50, 0.3) 0%,
            rgba(15, 15, 15, 0.08) 50%,
            rgba(0, 0, 0, 0) 80%
          );
          animation: driftFog2 140s linear infinite alternate;
        }

        @keyframes driftFog1 {
          0% { transform: rotate(0deg) translate(0px, 0px); }
          50% { transform: rotate(180deg) translate(50px, -30px); }
          100% { transform: rotate(360deg) translate(0px, 0px); }
        }

        @keyframes driftFog2 {
          0% { transform: rotate(180deg) translate(0px, 0px); }
          50% { transform: rotate(90deg) translate(-40px, 40px); }
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
          z-index: 3; /* Overlaying content very subtly */
          mix-blend-mode: soft-light;
          background: rgba(220, 230, 242, 0.02); /* Cold fluorescent bluish/white cast */
          animation: fluorescentBreathe 18s ease-in-out infinite;
        }

        @keyframes fluorescentBreathe {
          0%, 100% { 
            opacity: 0.3;
            background: rgba(220, 230, 242, 0.015);
          }
          48% {
            opacity: 0.35;
            background: rgba(220, 230, 242, 0.02);
          }
          50% {
            opacity: 0.15; /* Sudden micro flicker */
            background: rgba(220, 230, 242, 0.005);
          }
          51% {
            opacity: 0.4; /* Recovery glow */
            background: rgba(220, 230, 242, 0.025);
          }
          53% {
            opacity: 0.3;
            background: rgba(220, 230, 242, 0.015);
          }
          75% {
            opacity: 0.38;
            background: rgba(220, 230, 242, 0.022);
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
          z-index: 3; /* Creates architectural vignette depth over content */
          mix-blend-mode: multiply;
          will-change: background;
        }

        /* Cinematic Depth of Field focus pull on products */
        .product-grid:hover .product-card:not(:hover) {
          filter: blur(3.5px) grayscale(0.95) brightness(0.35);
          opacity: 0.18;
          transform: scale(0.96) translateZ(-20px);
        }

        .product-card {
          transition: filter 3.5s cubic-bezier(0.25, 1, 0.3, 1), 
                      opacity 3.5s cubic-bezier(0.25, 1, 0.3, 1), 
                      transform 3.5s cubic-bezier(0.25, 1, 0.3, 1) !important;
        }

        /* Ambient breathing on individual UI elements */
        .product-card:hover {
          filter: blur(0px) grayscale(0.25) brightness(0.95);
          opacity: 1 !important;
          transform: scale(1.025) translateZ(15px);
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.9);
        }
      `}</style>
    </>
  );
};

export default InvisibleDepthSystem;
