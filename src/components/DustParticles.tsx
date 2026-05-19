"use client";

import React, { useEffect, useRef } from 'react';

interface Particle {
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

const DustParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 45; // Extremely minimal, almost invisible count

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Initialize particles
    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        const z = Math.random(); // 0 to 1
        const depth = 0.1 + z * 0.9; // 0.1 to 1.0
        
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: depth,
          // Distant particles are smaller, near ones are slightly larger (0.3px to 1.3px)
          size: 0.35 + depth * 0.9,
          // Distant particles are more transparent (opacity 0.03 to 0.15)
          opacity: 0.03 + depth * 0.12,
          // Extremely slow, quiet drift (0.01px to 0.08px per frame)
          vx: (Math.random() - 0.5) * 0.04 * depth,
          vy: -(0.03 + Math.random() * 0.06) * depth, // Tend to float upwards very slowly
          angle: Math.random() * Math.PI * 2,
          angleSpeed: 0.0005 + Math.random() * 0.001,
          amplitude: 0.05 + Math.random() * 0.12,
        });
      }
    };
    initParticles();

    // Main animation loop
    const animate = () => {
      // Pause updates if tab is not active to conserve system battery/resources
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update positions using drift velocities + gentle sinusoidal perturbation
        p.angle += p.angleSpeed;
        p.x += p.vx + Math.sin(p.angle) * p.amplitude;
        p.y += p.vy + Math.cos(p.angle * 0.5) * (p.amplitude * 0.5);

        // Wrapping boundaries
        if (p.x < -20) p.x = canvas.width + 20;
        else if (p.x > canvas.width + 20) p.x = -20;
        
        if (p.y < -20) p.y = canvas.height + 20;
        else if (p.y > canvas.height + 20) p.y = -20;

        // Draw particle based on its depth
        if (p.z < 0.45) {
          // Distant, out-of-focus dust particles (soft, blurred depth of field bokeh)
          const radius = p.size * 2.2;
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
          gradient.addColorStop(0, `rgba(232, 232, 232, ${p.opacity})`);
          gradient.addColorStop(0.3, `rgba(232, 232, 232, ${p.opacity * 0.3})`);
          gradient.addColorStop(1, 'rgba(232, 232, 232, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Midground and foreground dust particles (crisp, tiny brutalist grains)
          ctx.fillStyle = `rgba(232, 232, 232, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2, // Floats behind the cursor follower and front-level HUD text, but over canvas
        opacity: 0.95,
      }}
      aria-hidden="true"
    />
  );
};

export default DustParticles;
