"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import Lenis from 'lenis';
import InteractiveHUD from '@/components/InteractiveHUD';
import GlobalNetworkMap from '@/components/GlobalNetworkMap';
import NetworkAccessForm from '@/components/NetworkAccessForm';
import { useAudio } from '@/context/AudioContext';

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPreloader, setShowPreloader] = useState(true);
  
  // Terminal state
  const [terminalActive, setTerminalActive] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLines, setTerminalLines] = useState<React.ReactNode[]>([
    <p key="1">RESTRICTED OBJECT CHAMBER 009 DETECTED.</p>,
    <p key="2">ARCHIVE KEY REQUIRED TO ACCESS COMPARTMENT 009.</p>
  ]);
  const [unlocked, setUnlocked] = useState(false);

  // Thermal Mode State
  const [thermalMode, setThermalMode] = useState(false);
  
  // HUD State
  const [dataSpeed, setDataSpeed] = useState('0.0');
  const [scrollProgress, setScrollProgress] = useState(0);

  // Modal State
  const [modalActive, setModalActive] = useState(false);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [coords, setCoords] = useState({ x: '0.0000', y: '0.0000' });
  
  // Mounted State to prevent Hydration errors
  const [mounted, setMounted] = useState(false);
  
  // Global Audio Context integration
  const { startAudio, updateSection, playClick, analyserRef } = useAudio();
  
  // Refs
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cartCountRef = useRef(0);
  const [cartText, setCartText] = useState('Cart (0)');

  useEffect(() => {
    // Prevent scrolling initially
    document.body.style.overflow = 'hidden';

    // Simulated Loading
    const loadInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 10) + 2;
        if (next >= 100) {
          clearInterval(loadInterval);
          setLoading(false);
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(loadInterval);
  }, []);

  // Lenis Smooth Scroll Setup
  useEffect(() => {
    // Initial HUD data
    setMounted(true);
    
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on('scroll', ({ velocity, progress }: any) => {
      // HUD Data Speed simulation
      const speed = (Math.abs(velocity) * 15.4).toFixed(1);
      setDataSpeed(speed);
      setScrollProgress(progress * 100);

      // Apply skew effect based on scroll velocity
      const skewValue = velocity * 0.4; // Intensity
      
      const elements = document.querySelectorAll('.product-card, .video-wrapper');
      elements.forEach((el) => {
        (el as HTMLElement).style.transform = `skewY(${skewValue}deg)`;
      });
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const handleEnter = () => {
    setLoading(true); // visually hide button
    setTimeout(() => {
      setShowPreloader(false);
      document.body.style.overflow = 'auto';
    }, 1200);
    startAudio();
  };

  // Section observer to subtly respond to scrolling sections
  useEffect(() => {
    const sections = ['home', 'shop', 'manifesto', 'network', 'campaign'];
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -30% 0px', // Trigger when section occupies central viewport
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id) {
            updateSection(id);
          }
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const footer = document.querySelector('footer');
    const footerObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updateSection('footer');
        }
      });
    }, { threshold: 0.1 });
    
    if (footer) footerObserver.observe(footer);

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
      if (footer) footerObserver.unobserve(footer);
    };
  }, [updateSection]);

  // Three.js Background and Cursor Logic
  useEffect(() => {
    // Custom Cursor
    let cursorX = 0;
    let cursorY = 0;
    let followerX = 0;
    let followerY = 0;
    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.left = `${cursorX}px`;
        cursorRef.current.style.top = `${cursorY}px`;
      }
    };

    const animateCursor = () => {
      followerX += (cursorX - followerX) * 0.15;
      followerY += (cursorY - followerY) * 0.15;
      if (followerRef.current) {
        followerRef.current.style.left = `${followerX}px`;
        followerRef.current.style.top = `${followerY}px`;
      }
      animationFrameId = requestAnimationFrame(animateCursor);
    };

    window.addEventListener('mousemove', onMouseMove);
    animateCursor();

    // Intersection Observer for fade-ins
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Manifesto cinematic reveal observer (lower threshold, earlier trigger)
    const manifestoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          manifestoObserver.unobserve(entry.target); // only trigger once
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

    document.querySelectorAll('.fade-manifesto').forEach(el => manifestoObserver.observe(el));

    // Three.js
    if (!canvasRef.current) return;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Core Object (Removed in favor of branded text symbol)
    // const geometry = new THREE.IcosahedronGeometry(12, 1);
    // const material = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true, transparent: true, opacity: 0.15 });
    // const core = new THREE.Mesh(geometry, material);
    // scene.add(core);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 800;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({ size: 0.05, color: 0x888888, transparent: true, opacity: 0.3 });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onThreeMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - windowHalfX);
      mouseY = (event.clientY - windowHalfY);
    };
    document.addEventListener('mousemove', onThreeMouseMove);

    const clock = new THREE.Clock();
    let threeAnimId: number;

    const animateThree = () => {
      threeAnimId = requestAnimationFrame(animateThree);
      const elapsedTime = clock.getElapsedTime();
      const targetX = mouseX * 0.001;
      const targetY = mouseY * 0.001;

      // Audio Reactive Logic
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Focus on low frequencies (bass) for pulse
        const bassValue = dataArray[2] || 0; 
        const avgValue = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        
        const scale = 1 + (bassValue / 255) * 0.1;
        particlesMesh.scale.set(scale, scale, scale);
        
        // Subtle opacity flicker based on average volume
        particlesMaterial.opacity = 0.15 + (avgValue / 255) * 0.4;
      }

      particlesMesh.rotation.y = -elapsedTime * 0.02;
      particlesMesh.rotation.x = -elapsedTime * 0.01;
      // core.rotation.y += 0.05 * (targetX - core.rotation.y);
      // core.rotation.x += 0.05 * (targetY - core.rotation.x);

      renderer.render(scene, camera);
    };
    animateThree();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onThreeMouseMove);
      cancelAnimationFrame(threeAnimId);
      window.removeEventListener('resize', onResize);
    };
  }, [showPreloader]);



  const handleTerminalSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = terminalInput.trim().toLowerCase();
      
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        body: JSON.stringify({ password: val })
      });

      if (res.ok) {
        setTerminalLines(prev => [
          ...prev,
          <p key={Date.now()} className="granted">ACCESS GRANTED.</p>,
          <p key={Date.now()+1} className="granted">CLEARANCE CONFIRMED. RETRIEVING COMPARTMENT 009...</p>
        ]);
        playClick(800, 0.5);
        
        setTimeout(() => {
          setTerminalActive(false);
          setUnlocked(true);
          playClick(400, 1);
          // Auto-redirect after unlocking
          setTimeout(() => {
            router.push('/secret');
          }, 1500);
        }, 2000);
      } else {
        setTerminalLines(prev => [
          ...prev,
          <p key={Date.now()} className="denied">ACCESS DENIED. ARCHIVE KEY INVALID.</p>
        ]);
        setTerminalInput('');
        playClick(100, 0.3);
      }
    }
  };

  const products = [
    {
      id: '1',
      title: 'ARCHIVE_001',
      meta: '€240.00',
      desc: 'PRESSURE-BUILT STRUCTURE',
      img: '/assets/archive_001.png',
      fullDesc: 'Pressure-built heavyweight structure. Archive wash treatment. Worn under weight.',
      specs: [
        ['WEIGHT', '500 GSM'],
        ['SILHOUETTE', 'OVERSIZED PROTECTIVE'],
        ['MARKING', 'DEGRADED SURFACE PRINT'],
        ['ORIGIN', 'UNDISCLOSED'],
      ]
    },
    {
      id: '2',
      title: 'ARCHIVE_002',
      meta: '€85.00',
      desc: 'LOW VISIBILITY UNIFORM',
      img: '/assets/archive_002.png',
      fullDesc: 'Low visibility base layer. Minimal surface. Degraded typography. Silent presence.',
      specs: [
        ['WEIGHT', '280 GSM'],
        ['SILHOUETTE', 'RELAXED VOID'],
        ['SURFACE', 'ARCHIVE WASH COTTON'],
        ['OBJECT STATUS', 'RECOVERED'],
      ]
    },
    {
      id: '3',
      title: 'SILENT_PRESSURE',
      meta: 'ARCHIVED.',
      desc: 'ARCHIVE WASH STRUCTURE',
      img: '/assets/archive_003.png',
      fullDesc: 'Recovered unit. Archive wash treatment. Built to absorb pressure without breaking.',
      specs: [
        ['WEIGHT', '420 GSM'],
        ['SILHOUETTE', 'BOXY STRUCTURE'],
        ['DYE', 'ARCHIVE GARMENT PIGMENT'],
        ['CLASSIFICATION', 'RESTRICTED ARCHIVE'],
      ]
    },
    {
      id: '4',
      title: 'ARCHIVE_004',
      meta: '€120.00',
      desc: 'CONCEALMENT SILHOUETTE',
      img: '/assets/28b61a06-d5db-4676-91bc-eead97c294c8.png',
      fullDesc: 'Concealment silhouette. Collapsed shoulder line. Constructed for low visibility.',
      specs: [
        ['WEIGHT', '320 GSM'],
        ['SILHOUETTE', 'OVERSIZED PROTECTIVE'],
        ['CONDITION', 'DEGRADED'],
        ['OBJECT STATUS', 'RECOVERED'],
      ]
    },
    {
      id: '5',
      title: 'ARCHIVE_005',
      meta: '€160.00',
      desc: 'SURVIVAL WEIGHT STRUCTURE',
      img: '/assets/6291e69b-1e82-4402-9b87-152ca115edcb.png',
      fullDesc: 'Survival weight structure. Inverted seam construction. Cold exterior, dense core.',
      specs: [
        ['WEIGHT', '450 GSM'],
        ['SILHOUETTE', 'BOXY STRUCTURE'],
        ['CONSTRUCTION', 'INVERTED SEAM'],
        ['OBJECT STATUS', 'RECOVERED'],
      ]
    },
    {
      id: '6',
      title: 'ARCHIVE_006',
      meta: '€190.00',
      desc: 'LIMITED ARCHIVE UNIT',
      img: '/assets/9786ee9f-9980-46b8-84a1-af18bdf7b420.png',
      fullDesc: 'Limited archive unit. Restricted outerwear system. Matte hardware. Pressure-rated.',
      specs: [
        ['FABRIC', 'NYLON BLEND'],
        ['SILHOUETTE', 'RELAXED VOID'],
        ['HARDWARE', 'MATTE BLACK SEALED'],
        ['OBJECT STATUS', 'RECOVERED'],
      ]
    },
    {
      id: '7',
      title: 'ARCHIVE_007',
      meta: '€110.00',
      desc: 'BASE LAYER UNIFORM',
      img: '/assets/WhatsApp Image 2026-05-14 at 03.23.51.jpeg',
      fullDesc: 'Base layer uniform. Unrefined edge condition. Acid wash treatment. No statement needed.',
      specs: [
        ['WEIGHT', '240 GSM'],
        ['SILHOUETTE', 'CLOSE RESTRAINT'],
        ['TREATMENT', 'ACID WASH DEGRADED'],
        ['OBJECT STATUS', 'RECOVERED'],
      ]
    },
    {
      id: '8',
      title: 'ARCHIVE_008',
      meta: '€90.00',
      desc: 'UNREFINED EDGE CONDITION',
      img: '/assets/WhatsApp Image 2026-05-14 at 03.26.53.jpeg',
      fullDesc: 'Unrefined edge condition. Cold pigment dye. Structural weight without declaration.',
      specs: [
        ['WEIGHT', '260 GSM'],
        ['SILHOUETTE', 'STRUCTURAL REGULAR'],
        ['DYE', 'COLD PIGMENT ARCHIVE'],
        ['OBJECT STATUS', 'RECOVERED'],
      ]
    },
  ];

  const handleProductClick = (prod: any) => {
    if (prod.meta === 'ARCHIVED.' && prod.title !== 'SILENT_PRESSURE') {
      playClick(100, 0.2);
      return;
    }
    setActiveProduct(prod);
    setCoords({
      x: (Math.random() * 100).toFixed(4),
      y: (Math.random() * 100).toFixed(4)
    });
    setModalActive(true);
    document.body.style.overflow = 'hidden';
    playClick(150, 0.15);
  };

  const handleVoidClick = () => {
    if (!unlocked) {
      setTerminalActive(true);
      setTimeout(() => inputRef.current?.focus(), 100);
      playClick(1200, 0.1);
    } else {
      router.push('/secret');
    }
  };

  const acquireProduct = () => {
    cartCountRef.current += 1;
    setCartText(`Cart (${cartCountRef.current})`);
    setTimeout(() => {
      setModalActive(false);
      document.body.style.overflow = 'auto';
    }, 800);
  };

  return (
    <>
      {/* Custom Cursor */}
      <div ref={cursorRef} className="cursor" style={{ display: (terminalActive || thermalMode) ? 'none' : 'block' }}></div>
      <div ref={followerRef} className="cursor-follower" style={{ display: (terminalActive || thermalMode) ? 'none' : 'block' }}></div>

      {/* Visual Effects Overlays */}
      <div className="scanline-overlay"></div>
      <div className="hud-indicator">
        <span className="rec-dot"></span>
        REC [00:00:{Math.floor(progress/10)}] — RECOVERY SIGNAL FADED — CONDITION SURVEY
      </div>

      {/* Live Feed HUD */}
      {mounted && (
        <InteractiveHUD 
          thermalMode={thermalMode} 
          scrollProgress={scrollProgress}
          dataSpeed={dataSpeed}
        />
      )}

      {/* Preloader */}
      <div id="preloader" className={!showPreloader ? 'hide' : ''} style={{ display: showPreloader ? 'flex' : 'none' }}>
        <div className="preloader-content">
          <div className="glitch-text" data-text="WORTHLESS">WORTHLESS</div>
          {!loading ? (
            <button id="enter-button" style={{ display: 'inline-block' }} onClick={handleEnter}>ENTER ARCHIVE</button>
          ) : (
            <div id="loading-percentage">{progress < 10 ? `0${progress}%` : `${progress}%`}</div>
          )}
        </div>
      </div>

      {/* Cinematic Background Video */}
      <video 
        id="bg-video" 
        src="/assets/storyline_export.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: -2,
          filter: 'brightness(0.2) contrast(1.2)'
        }}
      />
      <canvas id="bg-canvas" ref={canvasRef}></canvas>
      <div className="grain"></div>

      <header>
        <div className="logo">
          <a href="#home" className="product-title" style={{ letterSpacing: '0.2em' }}>WORTHLESS</a>
        </div>
        <nav>
          <button 
            className={`thermal-mode-toggle ${thermalMode ? 'active' : ''}`}
            onClick={() => {
              setThermalMode(!thermalMode);
              playClick(thermalMode ? 400 : 1200, 0.1);
            }}
          >
            {thermalMode ? 'SURVEY: ON' : 'SURVEY: OFF'}
          </button>
          <a href="#shop">Shop</a>
          <a href="#archive">Archive</a>
          <a href="#manifesto">Manifesto</a>
          <a href="#network">Network</a>
          <a href="#campaign">Campaign</a>
          <a href="#cart">{cartText}</a>
        </nav>
      </header>

      <main id="app" className={thermalMode ? 'thermal-mode' : ''}>
        {/* Hero Section */}
        <section id="home" className="hero">
          <div className="hero-content">
            <h1>WORTHLESS</h1>
            <p className="subtext">SILENT PRESSURE.</p>
          </div>
          <div className="scroll-indicator"></div>
        </section>

        {/* Shop Section */}
        <section id="shop">
          <div className="container">
            <h2 className="fade-in">THE ARCHIVE</h2>
            <div className="product-grid" id="product-list">
              {products.map((prod) => (
                <div key={prod.id} className="product-card fade-in" onClick={() => handleProductClick(prod)} onMouseEnter={() => { followerRef.current?.classList.add('active'); if (thermalMode) playClick(1200, 0.02); }} onMouseLeave={() => followerRef.current?.classList.remove('active')}>
                  <div className="product-image-container">
                    <div className="xray-scan"></div>
                    <img src={prod.img} alt={prod.title} loading="lazy" />
                  </div>
                  <div className="product-info">
                    <div className="product-title">{prod.title}</div>
                    <div className="product-meta">{prod.meta}</div>
                  </div>
                  <div className="product-meta" style={{ marginTop: '0.5rem' }}>{prod.desc}</div>
                </div>
              ))}

              {/* Product 9 (VOID) */}
              <div className="product-card fade-in" id="void-product" data-locked={!unlocked} onClick={handleVoidClick} onMouseEnter={() => { followerRef.current?.classList.add('active'); if (thermalMode) playClick(1200, 0.02); }} onMouseLeave={() => followerRef.current?.classList.remove('active')}>
                <div className="product-image-container">
                  <div className="xray-scan"></div>
                  <div style={{ width: '100%', height: '100%', background: unlocked ? 'none' : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="subtext" style={{ fontSize: '0.5rem' }} id="void-image-text">{unlocked ? 'RESTRICTION LIFTED' : 'VOID_STATE'}</span>
                  </div>
                </div>
                <div className="product-info">
                  <div className="product-title">VOID_STATE</div>
                  <div className="product-meta" id="void-meta">{unlocked ? 'OPEN' : 'ARCHIVED.'}</div>
                </div>
                <div className="product-meta" style={{ marginTop: '0.5rem' }} id="void-desc">{unlocked ? 'UNLOCKED' : 'RESTRICTED ACCESS'}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Manifesto Section */}
        <section id="manifesto" className="manifesto">
          <div className="manifesto-content">

            {/* Low-contrast label */}
            <span className="manifesto-label">Archive Statement</span>

            {/* Thesis — emotional law */}
            <div className="manifesto-thesis fade-manifesto">
              THE MODERN WORLD<br />
              PROFITS FROM INSECURITY.
            </div>

            {/* Vertical hairline divider */}
            <div className="manifesto-divider" />

            {/* Human, quiet voice */}
            <div className="manifesto-body fade-manifesto">
              Worthless was built for the people<br />
              who survived it{' '}
              <span
                id="secret-trigger"
                onClick={handleVoidClick}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => { followerRef.current?.classList.add('active'); }}
                onMouseLeave={() => followerRef.current?.classList.remove('active')}
              >
                silently
              </span>.
            </div>

            {/* Cold conclusion */}
            <div className="manifesto-conclusion fade-manifesto">
              No glorification of weakness.<br />
              Only endurance under pressure.
            </div>

            {/* Final mark */}
            <span className="manifesto-stay-cold fade-manifesto">Stay Cold.</span>

          </div>
        </section>

        {/* Global Network Section */}
        <section id="network" className="network-section">
          <div className="container">

            {/* Section identity */}
            <div className="fade-in network-header">
              <span className="subtext network-label">Network</span>
              <h2 className="network-heading">GLOBAL_VOID_NETWORK</h2>
              <p className="network-body">
                A silent index of people who endured pressure.
              </p>
              <div className="network-meta">
                <span>CONNECTED MEMBERS: ACTIVE</span>
                <span className="network-meta-divider">·</span>
                <span>ACCESS: RESTRICTED</span>
              </div>
            </div>

            {/* Archive Map */}
            <div className="fade-in">
              <GlobalNetworkMap thermalMode={thermalMode} />
            </div>

            {/* REQUEST ACCESS form */}
            <NetworkAccessForm />

          </div>
        </section>

        {/* Campaign Section */}
        <section id="campaign" className="campaign">
          <div className="container">
            <h2 className="fade-in">VISUAL RECORDS</h2>
            <div className="video-grid">
              <div className="video-wrapper fade-in" onMouseEnter={() => { cursorRef.current?.classList.add('hidden'); followerRef.current?.classList.add('watch-active'); playClick(1200, 0.05); }} onMouseLeave={() => { cursorRef.current?.classList.remove('hidden'); followerRef.current?.classList.remove('watch-active'); }}>
                <video src="/assets/storyline_export.mp4" autoPlay loop muted playsInline></video>
                <div className="video-overlay">RECORD_01</div>
              </div>
              <div className="video-wrapper fade-in" onMouseEnter={() => { cursorRef.current?.classList.add('hidden'); followerRef.current?.classList.add('watch-active'); playClick(1200, 0.05); }} onMouseLeave={() => { cursorRef.current?.classList.remove('hidden'); followerRef.current?.classList.remove('watch-active'); }}>
                <video src="/assets/storyline_export2.mp4" autoPlay loop muted playsInline></video>
                <div className="video-overlay">RECORD_02</div>
              </div>
              <div className="video-wrapper fade-in" onMouseEnter={() => { cursorRef.current?.classList.add('hidden'); followerRef.current?.classList.add('watch-active'); playClick(1200, 0.05); }} onMouseLeave={() => { cursorRef.current?.classList.remove('hidden'); followerRef.current?.classList.remove('watch-active'); }}>
                <video src="/assets/worthless yelek.mp4" autoPlay loop muted playsInline></video>
                <div className="video-overlay">YELEK_ARCHIVE</div>
              </div>
              <div className="video-wrapper fade-in" onMouseEnter={() => { cursorRef.current?.classList.add('hidden'); followerRef.current?.classList.add('watch-active'); playClick(1200, 0.05); }} onMouseLeave={() => { cursorRef.current?.classList.remove('hidden'); followerRef.current?.classList.remove('watch-active'); }}>
                <video src="/assets/absent).mp4" autoPlay loop muted playsInline></video>
                <div className="video-overlay">ABSENT_STATE</div>
              </div>
              <div className="video-wrapper fade-in" onMouseEnter={() => { cursorRef.current?.classList.add('hidden'); followerRef.current?.classList.add('watch-active'); playClick(1200, 0.05); }} onMouseLeave={() => { cursorRef.current?.classList.remove('hidden'); followerRef.current?.classList.remove('watch-active'); }}>
                <video src="/assets/storyline_export grikesik.mp4" autoPlay loop muted playsInline></video>
                <div className="video-overlay">GREY_CUT</div>
              </div>
              <div className="video-wrapper fade-in" onMouseEnter={() => { cursorRef.current?.classList.add('hidden'); followerRef.current?.classList.add('watch-active'); playClick(1200, 0.05); }} onMouseLeave={() => { cursorRef.current?.classList.remove('hidden'); followerRef.current?.classList.remove('watch-active'); }}>
                <video src="/assets/storyline_export3.mp4" autoPlay loop muted playsInline></video>
                <div className="video-overlay">RECORD_04</div>
              </div>
              <div className="video-wrapper fade-in" style={{ gridColumn: '1 / -1' }} onMouseEnter={() => { cursorRef.current?.classList.add('hidden'); followerRef.current?.classList.add('watch-active'); playClick(1200, 0.05); }} onMouseLeave={() => { cursorRef.current?.classList.remove('hidden'); followerRef.current?.classList.remove('watch-active'); }}>
                <video src="/assets/sonvideo4.mp4" autoPlay loop muted playsInline></video>
                <div className="video-overlay">THE FINAL RECORD</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Product Modal */}
      <div id="product-modal" className={`modal ${modalActive ? 'active blueprint' : ''}`}>
        <div className="grid-overlay"></div>
        <div className="restricted-stamp">RESTRICTED_ARCHIVE</div>
        <div className="modal-close" onClick={() => { setModalActive(false); document.body.style.overflow = 'auto'; }}>CLOSE_ARCHIVE_FILE</div>
        {activeProduct && (
          <div className="product-detail-grid" style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ position: 'relative' }}>
              <img src={activeProduct.img} className="product-detail-image blueprint-image" alt={activeProduct.title} />
              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', fontSize: '0.5rem', opacity: 0.5 }}>
                COORD_X: {coords.x} <br />
                COORD_Y: {coords.y}
              </div>
            </div>
            <div className="product-detail-info">
              <p className="subtext" style={{ fontSize: '0.6rem', marginBottom: '1rem' }}>OBJECT RECORD // REF_{activeProduct.id}</p>
              <h2>{activeProduct.title}</h2>
              <p style={{ opacity: 0.8 }}>{activeProduct.fullDesc}</p>
              <ul className="product-specs">
                {activeProduct.specs.map((spec: any, i: number) => (
                  <li key={i} style={{ borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                    <span style={{ color: '#00b4d8' }}>{spec[0]}</span>
                    <span>{spec[1]}</span>
                  </li>
                ))}
              </ul>
              <button className="buy-button" style={{ background: '#00b4d8', color: '#001d3d' }} onClick={acquireProduct}>ACQUIRE OBJECT — {activeProduct.meta}</button>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Modal */}
      <div id="terminal-modal" className={`terminal-overlay ${terminalActive ? 'active' : ''}`}>
        <div className="terminal-content">
          <div className="terminal-header">
            <span>ARCHIVE ACCESS NODE</span>
            <span className="terminal-close" onClick={() => {
              setTerminalActive(false);
              setTerminalLines([
                <p key="1">RESTRICTED OBJECT CHAMBER 009 DETECTED.</p>,
                <p key="2">ARCHIVE KEY REQUIRED TO ACCESS COMPARTMENT 009.</p>
              ]);
              setTerminalInput('');
            }}>[CLOSE]</span>
          </div>
          <div className="terminal-body">
            {terminalLines}
            <div className="terminal-input-line">
              <span className="prompt">{'>'}</span>
              <input 
                type="text" 
                ref={inputRef}
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalSubmit}
                autoComplete="off" 
                spellCheck="false" 
                autoFocus 
              />
            </div>
          </div>
        </div>
      </div>

      <footer style={{ padding: '4rem 2rem', textAlign: 'center', opacity: 0.3, fontSize: '0.6rem', letterSpacing: '0.2em' }}>
        © 2026 WORTHLESS ARCHIVE. ALL OBJECTS CLASSIFIED.
      </footer>


    </>
  );
}
