"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface AudioContextType {
  soundOn: boolean;
  isInitialized: boolean;
  currentSection: string;
  toggleSound: () => void;
  startAudio: () => Promise<void>;
  updateSection: (section: string) => void;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  playClick: (freq: number, duration: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);


export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundOn, setSoundOn] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSection, setCurrentSection] = useState('home');

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Master Gain & Analyser Refs
  const masterGainRef = useRef<GainNode | null>(null);
  const sectionGainRef = useRef<GainNode | null>(null); // For section-based adjustments
  const silenceGainRef = useRef<GainNode | null>(null); // For breathing silence cycle
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Layer Gain Refs (to dynamically control volumes)
  const droneGainRef = useRef<GainNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const roomGainRef = useRef<GainNode | null>(null);
  const airGainRef = useRef<GainNode | null>(null);
  const analogGainRef = useRef<GainNode | null>(null);
  const metallicGainRef = useRef<GainNode | null>(null);

  // Nodes for dynamic adjustment
  const droneFilterRef = useRef<BiquadFilterNode | null>(null);
  const airFilterRef = useRef<BiquadFilterNode | null>(null);
  const metallicDelayRef = useRef<DelayNode | null>(null);
  const metallicFeedbackRef = useRef<GainNode | null>(null);

  // Keep track of active source nodes to stop them on unmount
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);

  // Periodic interval/timeout IDs
  const metallicIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to generate Noise Buffers (White / Brown)
  const createBrownNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise: accumulate white noise and scale down
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Amplify slightly to normal range
    }
    return buffer;
  };

  const createWhiteNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const playClick = (freq: number, duration: number) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(master);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  // 1. Initialize Audio Context and Layers
  const startAudio = async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // Create Main Routing Nodes
    const masterGain = ctx.createGain();
    // Default volume: between 0.05 and 0.08. Mobile: even lower.
    const defaultVolume = isMobile ? 0.04 : 0.07;
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    // Smooth fade-in over 4 seconds
    masterGain.gain.linearRampToValueAtTime(defaultVolume, ctx.currentTime + 4.0);
    masterGainRef.current = masterGain;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const silenceGain = ctx.createGain();
    silenceGain.gain.setValueAtTime(1.0, ctx.currentTime);
    silenceGainRef.current = silenceGain;

    const sectionGain = ctx.createGain();
    sectionGain.gain.setValueAtTime(1.0, ctx.currentTime);
    sectionGainRef.current = sectionGain;

    // Routing: Layers -> SectionGain -> SilenceGain -> MasterGain -> Analyser -> Destination
    sectionGain.connect(silenceGain);
    silenceGain.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    // ==========================================
    // LAYER 1: INDUSTRIAL DRONE LAYER
    // ==========================================
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.35, ctx.currentTime);
    droneGainRef.current = droneGain;

    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(95, ctx.currentTime); // Deep sub-bass cutoff
    droneFilterRef.current = droneFilter;

    // Detuned sub oscillators
    const droneOsc1 = ctx.createOscillator();
    droneOsc1.type = 'sine';
    droneOsc1.frequency.setValueAtTime(55.0, ctx.currentTime); // A1

    const droneOsc2 = ctx.createOscillator();
    droneOsc2.type = 'sine';
    droneOsc2.frequency.setValueAtTime(55.3, ctx.currentTime); // Slight detune for beating effect

    // Connect Drone Layer
    droneOsc1.connect(droneFilter);
    droneOsc2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(sectionGain);

    droneOsc1.start();
    droneOsc2.start();
    activeOscillatorsRef.current.push(droneOsc1, droneOsc2);

    // Drone LFO to modulate gain slowly (50s period)
    const droneLfo = ctx.createOscillator();
    droneLfo.frequency.setValueAtTime(0.02, ctx.currentTime);
    const droneLfoGain = ctx.createGain();
    droneLfoGain.gain.setValueAtTime(0.12, ctx.currentTime); // Modulate drone slightly
    droneLfo.connect(droneLfoGain);
    droneLfoGain.connect(droneGain.gain);
    droneLfo.start();
    activeOscillatorsRef.current.push(droneLfo);

    // ==========================================
    // LAYER 2: FLUORESCENT HUM LAYER
    // ==========================================
    const humGain = ctx.createGain();
    humGain.gain.setValueAtTime(0.005, ctx.currentTime); // Very soft
    humGainRef.current = humGain;

    const humFilter = ctx.createBiquadFilter();
    humFilter.type = 'bandpass';
    humFilter.frequency.setValueAtTime(120, ctx.currentTime);
    humFilter.Q.setValueAtTime(1.0, ctx.currentTime);

    const humOsc60 = ctx.createOscillator();
    humOsc60.type = 'sine';
    humOsc60.frequency.setValueAtTime(60, ctx.currentTime); // Ground loop hum

    const humOsc120 = ctx.createOscillator();
    humOsc120.type = 'triangle';
    humOsc120.frequency.setValueAtTime(120, ctx.currentTime); // Copper buzz

    humOsc60.connect(humFilter);
    humOsc120.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(sectionGain);

    humOsc60.start();
    humOsc120.start();
    activeOscillatorsRef.current.push(humOsc60, humOsc120);

    // Listen to custom fluorescent light flicker from LiveEnvironmentSystem
    const handleFlicker = (e: Event) => {
      const customEvent = e as CustomEvent;
      const intensity = customEvent.detail?.intensity || 0; // 0 to 0.7
      const now = ctx.currentTime;
      
      if (intensity > 0) {
        // Flickering crackle & frequency shifts on fluorescent buzz
        humGain.gain.setValueAtTime(0.005 + intensity * 0.022, now);
        humOsc120.frequency.setValueAtTime(120 + Math.random() * 15, now);
      } else {
        // Return to standard hum state
        humGain.gain.setTargetAtTime(0.005, now, 0.15);
        humOsc120.frequency.setTargetAtTime(120, now, 0.1);
      }
    };
    window.addEventListener('env-flicker', handleFlicker);

    // ==========================================
    // LAYER 3: CONCRETE ROOM TONE
    // ==========================================
    const roomGain = ctx.createGain();
    roomGain.gain.setValueAtTime(0.06, ctx.currentTime);
    roomGainRef.current = roomGain;

    const roomNoiseBuffer = createBrownNoiseBuffer(ctx);
    const roomNoiseSource = ctx.createBufferSource();
    roomNoiseSource.buffer = roomNoiseBuffer;
    roomNoiseSource.loop = true;

    const roomFilter = ctx.createBiquadFilter();
    roomFilter.type = 'lowpass';
    roomFilter.frequency.setValueAtTime(180, ctx.currentTime);

    // Procedural Reflection Network (Reverb Approximation)
    // 3 parallel delays with prime numbers to simulate early reflection dense wash
    const delay1 = ctx.createDelay(1.0);
    const delay2 = ctx.createDelay(1.0);
    const delay3 = ctx.createDelay(1.0);

    delay1.delayTime.setValueAtTime(0.113, ctx.currentTime);
    delay2.delayTime.setValueAtTime(0.167, ctx.currentTime);
    delay3.delayTime.setValueAtTime(0.229, ctx.currentTime);

    const feedback1 = ctx.createGain();
    const feedback2 = ctx.createGain();
    const feedback3 = ctx.createGain();

    feedback1.gain.setValueAtTime(0.3, ctx.currentTime);
    feedback2.gain.setValueAtTime(0.25, ctx.currentTime);
    feedback3.gain.setValueAtTime(0.2, ctx.currentTime);

    // Connect Reflections
    roomNoiseSource.connect(roomFilter);
    roomFilter.connect(roomGain);

    // Feed room tone into delays to simulate space
    roomFilter.connect(delay1);
    roomFilter.connect(delay2);
    roomFilter.connect(delay3);

    // Cross feedback loop
    delay1.connect(feedback1);
    feedback1.connect(delay2);
    feedback1.connect(roomGain);

    delay2.connect(feedback2);
    feedback2.connect(delay3);
    feedback2.connect(roomGain);

    delay3.connect(feedback3);
    feedback3.connect(delay1);
    feedback3.connect(roomGain);

    roomGain.connect(sectionGain);
    roomNoiseSource.start();
    activeSourcesRef.current.push(roomNoiseSource);

    // ==========================================
    // LAYER 4: ANALOG AMBIENCE LAYER
    // ==========================================
    const analogGain = ctx.createGain();
    analogGain.gain.setValueAtTime(0.35, ctx.currentTime);
    analogGainRef.current = analogGain;

    // Hiss (soft white noise)
    const whiteNoiseBuffer = createWhiteNoiseBuffer(ctx);
    const hissSource = ctx.createBufferSource();
    hissSource.buffer = whiteNoiseBuffer;
    hissSource.loop = true;

    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'bandpass';
    hissFilter.frequency.setValueAtTime(4500, ctx.currentTime);
    hissFilter.Q.setValueAtTime(0.4, ctx.currentTime);

    const hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0.016, ctx.currentTime); // Soft warm analog tape hiss

    hissSource.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(analogGain);
    hissSource.start();
    activeSourcesRef.current.push(hissSource);

    // Tape wow-and-flutter (modulate drone pitch)
    const wowOsc = ctx.createOscillator();
    wowOsc.frequency.setValueAtTime(0.18, ctx.currentTime); // Slow wow
    const wowGain = ctx.createGain();
    wowGain.gain.setValueAtTime(0.35, ctx.currentTime); // 0.35Hz drift
    wowOsc.connect(wowGain);
    wowGain.connect(droneOsc1.frequency);
    wowGain.connect(droneOsc2.frequency);
    wowOsc.start();
    activeOscillatorsRef.current.push(wowOsc);

    // Procedural Record Dust Clicks
    const triggerVinylClick = () => {
      if (!soundOn || ctx.state === 'suspended') return;
      
      const now = ctx.currentTime;
      // Duration of click: 2ms - 8ms
      const clickLen = 0.002 + Math.random() * 0.005;
      const clickBuffer = ctx.createBuffer(1, ctx.sampleRate * clickLen, ctx.sampleRate);
      const channel = clickBuffer.getChannelData(0);
      
      for (let i = 0; i < channel.length; i++) {
        // High impulse decaying exponentially
        channel[i] = (Math.random() * 2 - 1) * Math.exp(-i * (8 / channel.length));
      }
      
      const clickSource = ctx.createBufferSource();
      clickSource.buffer = clickBuffer;

      // Bandpass around midrange-highs for warm scratchy click
      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(800 + Math.random() * 1200, now);
      clickFilter.Q.setValueAtTime(2.0, now);

      const clickVolume = ctx.createGain();
      clickVolume.gain.setValueAtTime(0.07 + Math.random() * 0.09, now);

      clickSource.connect(clickFilter);
      clickFilter.connect(clickVolume);
      clickVolume.connect(analogGain);

      clickSource.start();
    };

    // Run click generation interval
    const scheduleNextClick = () => {
      const delay = 1500 + Math.random() * 4500;
      clickIntervalRef.current = setTimeout(() => {
        triggerVinylClick();
        scheduleNextClick();
      }, delay);
    };
    scheduleNextClick();

    analogGain.connect(sectionGain);

    // ==========================================
    // LAYER 5: DISTANT METALLIC RESONANCE
    // ==========================================
    const metallicGain = ctx.createGain();
    metallicGain.gain.setValueAtTime(0.12, ctx.currentTime);
    metallicGainRef.current = metallicGain;

    const delayNode = ctx.createDelay(1.2);
    delayNode.delayTime.setValueAtTime(0.7, ctx.currentTime);
    metallicDelayRef.current = delayNode;

    const feedbackGain = ctx.createGain();
    feedbackGain.gain.setValueAtTime(0.48, ctx.currentTime); // Long decay feedback
    metallicFeedbackRef.current = feedbackGain;

    const resonantFilter = ctx.createBiquadFilter();
    resonantFilter.type = 'bandpass';
    resonantFilter.frequency.setValueAtTime(950, ctx.currentTime); // Metallic bell resonance
    resonantFilter.Q.setValueAtTime(25, ctx.currentTime); // High selectivity

    // Connect feedback echo loop
    delayNode.connect(resonantFilter);
    resonantFilter.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    feedbackGain.connect(metallicGain);

    metallicGain.connect(sectionGain);

    // Resonant chime structure generator
    const triggerMetallicResonance = (intensity = 0.5) => {
      if (!soundOn || ctx.state === 'suspended') return;
      const now = ctx.currentTime;
      
      const numOscs = 3;
      const baseFreq = 160 + Math.random() * 80; // deep metal pipe resonance
      
      const chimeOscs: OscillatorNode[] = [];
      const chimeGain = ctx.createGain();
      
      // Feed very quickly
      chimeGain.gain.setValueAtTime(0, now);
      chimeGain.gain.linearRampToValueAtTime(0.015 * intensity, now + 0.05);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      for (let i = 0; i < numOscs; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        // Inharmonic metallic partials: 1.0, 2.72, 4.38
        const ratio = i === 0 ? 1.0 : i === 1 ? 2.72 : 4.38;
        osc.frequency.setValueAtTime(baseFreq * ratio, now);
        osc.connect(chimeGain);
        osc.start();
        osc.stop(now + 2.6);
        chimeOscs.push(osc);
      }

      // Route chime into the vault reflection delay line
      chimeGain.connect(delayNode);
    };

    // Periodically trigger environmental structural shifts in concrete hall (every 18s-40s)
    const runMetallicScheduler = () => {
      const delay = 18000 + Math.random() * 22000;
      metallicIntervalRef.current = setTimeout(() => {
        triggerMetallicResonance(0.3 + Math.random() * 0.5);
        runMetallicScheduler();
      }, delay);
    };
    runMetallicScheduler();

    // Custom hover event hook from website components
    const handleHover = () => {
      triggerMetallicResonance(0.8);
    };
    window.addEventListener('env-hover-resonance', handleHover);

    // ==========================================
    // LAYER 6: ENVIRONMENTAL AIR MOVEMENT
    // ==========================================
    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.08, ctx.currentTime);
    airGainRef.current = airGain;

    const airNoiseSource = ctx.createBufferSource();
    airNoiseSource.buffer = roomNoiseBuffer; // Share brown noise
    airNoiseSource.loop = true;

    const airFilter = ctx.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.frequency.setValueAtTime(280, ctx.currentTime); // Wind whistle band
    airFilter.Q.setValueAtTime(1.8, ctx.currentTime);
    airFilterRef.current = airFilter;

    airNoiseSource.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(sectionGain);
    airNoiseSource.start();
    activeSourcesRef.current.push(airNoiseSource);

    // Sweeping wind LFO to simulate moving air gusts (45s period)
    const windLfo = ctx.createOscillator();
    windLfo.frequency.setValueAtTime(0.022, ctx.currentTime);
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.setValueAtTime(80, ctx.currentTime); // Sweep frequency +-80Hz
    
    windLfo.connect(windLfoGain);
    windLfoGain.connect(airFilter.frequency);
    windLfo.start();
    activeOscillatorsRef.current.push(windLfo);

    // Modulation of wind volume
    const windVolumeLfo = ctx.createOscillator();
    windVolumeLfo.frequency.setValueAtTime(0.015, ctx.currentTime);
    const windVolumeLfoGain = ctx.createGain();
    windVolumeLfoGain.gain.setValueAtTime(0.04, ctx.currentTime);
    
    windVolumeLfo.connect(windVolumeLfoGain);
    windVolumeLfoGain.connect(airGain.gain);
    windVolumeLfo.start();
    activeOscillatorsRef.current.push(windVolumeLfo);

    // ==========================================
    // LAYER 7: SILENCE MANAGEMENT (Respiration)
    // ==========================================
    // We will create a slow respiration LFO that dips silenceGain
    // creating periods of heavy silence every 75 seconds.
    const silenceLfo = ctx.createOscillator();
    silenceLfo.frequency.setValueAtTime(0.013, ctx.currentTime); // 77-second respiration cycle
    const silenceLfoGain = ctx.createGain();
    // Modulate gain by 0.35, meaning silenceGain.gain will dip from 1.0 down to 0.45 slowly
    silenceLfoGain.gain.setValueAtTime(0.45, ctx.currentTime);
    
    silenceLfo.connect(silenceLfoGain);
    // Offset so modulation oscillates between 0.55 and 1.45, clamped/scaled appropriately
    silenceLfoGain.connect(silenceGain.gain);
    silenceLfo.start();
    activeOscillatorsRef.current.push(silenceLfo);

    setIsInitialized(true);
    setSoundOn(true);
  };

  // 2. Toggle Sound (Mute/Unmute)
  const toggleSound = () => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    if (soundOn) {
      // Fade out slowly
      playClick(180, 0.1);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      setSoundOn(false);
    } else {
      // Resume context if suspended
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      playClick(360, 0.1);
      const defaultVolume = isMobile ? 0.04 : 0.07;
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(defaultVolume, ctx.currentTime + 0.4);
      setSoundOn(true);
    }
  };

  // 3. Section-Based Audio Response
  const updateSection = (section: string) => {
    setCurrentSection(section);
    const ctx = audioCtxRef.current;
    const droneFilter = droneFilterRef.current;
    const roomGain = roomGainRef.current;
    const airFilter = airFilterRef.current;
    const metallicFeedback = metallicFeedbackRef.current;
    const sectionGain = sectionGainRef.current;

    if (!ctx || !isInitialized) return;

    const now = ctx.currentTime;
    const transitionTime = 3.0; // 3-second extremely slow, subtle transition

    switch (section) {
      case 'home':
        // Hero: Deeper drone, more quiet room tone, lower feedback (heavy pressure)
        if (droneFilter) droneFilter.frequency.setTargetAtTime(75, now, transitionTime);
        if (roomGain) roomGain.gain.setTargetAtTime(0.02, now, transitionTime);
        if (airFilter) airFilter.frequency.setTargetAtTime(220, now, transitionTime);
        if (metallicFeedback) metallicFeedback.gain.setTargetAtTime(0.25, now, transitionTime);
        if (sectionGain) sectionGain.gain.setTargetAtTime(0.85, now, transitionTime);
        break;

      case 'shop':
        // Product Grid: Slightly higher drone frequency, louder room ventilation, active resonances
        if (droneFilter) droneFilter.frequency.setTargetAtTime(110, now, transitionTime);
        if (roomGain) roomGain.gain.setTargetAtTime(0.08, now, transitionTime);
        if (airFilter) airFilter.frequency.setTargetAtTime(320, now, transitionTime);
        if (metallicFeedback) metallicFeedback.gain.setTargetAtTime(0.55, now, transitionTime);
        if (sectionGain) sectionGain.gain.setTargetAtTime(1.1, now, transitionTime);
        break;

      case 'manifesto':
        // Manifesto: Deeper drone, maximum air current ventilation and pressure
        if (droneFilter) droneFilter.frequency.setTargetAtTime(60, now, transitionTime);
        if (roomGain) roomGain.gain.setTargetAtTime(0.09, now, transitionTime);
        if (airFilter) airFilter.frequency.setTargetAtTime(260, now, transitionTime);
        if (metallicFeedback) metallicFeedback.gain.setTargetAtTime(0.35, now, transitionTime);
        if (sectionGain) sectionGain.gain.setTargetAtTime(1.2, now, transitionTime);
        break;

      case 'network':
      case 'campaign':
        // Standard industrial ambient level
        if (droneFilter) droneFilter.frequency.setTargetAtTime(95, now, transitionTime);
        if (roomGain) roomGain.gain.setTargetAtTime(0.05, now, transitionTime);
        if (airFilter) airFilter.frequency.setTargetAtTime(280, now, transitionTime);
        if (metallicFeedback) metallicFeedback.gain.setTargetAtTime(0.48, now, transitionTime);
        if (sectionGain) sectionGain.gain.setTargetAtTime(1.0, now, transitionTime);
        break;

      case 'footer':
        // Footer: Thin, cold fading atmosphere, lower volume
        if (droneFilter) droneFilter.frequency.setTargetAtTime(55, now, transitionTime);
        if (roomGain) roomGain.gain.setTargetAtTime(0.015, now, transitionTime);
        if (airFilter) airFilter.frequency.setTargetAtTime(150, now, transitionTime);
        if (metallicFeedback) metallicFeedback.gain.setTargetAtTime(0.15, now, transitionTime);
        if (sectionGain) sectionGain.gain.setTargetAtTime(0.45, now, transitionTime);
        break;

      default:
        break;
    }
  };

  // Suspend Audio on Page Hidden / Resume on Visible for optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      const ctx = audioCtxRef.current;
      if (!ctx || !isInitialized) return;

      if (document.hidden) {
        // Suspend slowly or immediately
        ctx.suspend();
      } else {
        if (soundOn) {
          ctx.resume();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInitialized, soundOn]);

  // Clean up all nodes on component unmount
  useEffect(() => {
    return () => {
      if (metallicIntervalRef.current) clearTimeout(metallicIntervalRef.current);
      if (clickIntervalRef.current) clearTimeout(clickIntervalRef.current);

      activeSourcesRef.current.forEach(source => {
        try { source.stop(); } catch (e) {}
      });
      activeOscillatorsRef.current.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });

      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <AudioContext.Provider
      value={{
        soundOn,
        isInitialized,
        currentSection,
        toggleSound,
        startAudio,
        updateSection,
        analyserRef,
        playClick
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
