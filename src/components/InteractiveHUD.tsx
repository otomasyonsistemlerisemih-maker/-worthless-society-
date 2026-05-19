"use client";

import React, { useState, useEffect, useRef } from 'react';

interface InteractiveHUDProps {
  thermalMode: boolean;
  scrollProgress: number;
  dataSpeed: string;
}

const InteractiveHUD: React.FC<InteractiveHUDProps> = ({ thermalMode, scrollProgress, dataSpeed }) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [signal, setSignal] = useState(98);
  const [sessionID] = useState(() => Math.random().toString(16).toUpperCase().substring(2, 10));
  const [currentTime, setCurrentTime] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  
  const logMessages = [
    "LOADING ARCHIVE RECORDS...",
    "OBJECT INDEXED: REF_8821B",
    "CLASSIFYING ACCESS ENTRY...",
    "RECOVERY SIGNAL UNSTABLE",
    "ARCHIVE CONNECTION ACTIVE",
    "ENTRY RECORDED",
    "CONDITION SURVEY ACTIVE",
    "RETRIEVING OBJECT 09",
    "SIGNAL DELAYED",
    "CLEARANCE PENDING..."
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };

    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString().split('T')[1].split('.')[0] + ' UTC');
      
      // Randomly add logs
      if (Math.random() > 0.7) {
        setLogs(prev => {
          const newLogs = [...prev, logMessages[Math.floor(Math.random() * logMessages.length)]];
          if (newLogs.length > 5) return newLogs.slice(1);
          return newLogs;
        });
      }

      // Fluctuating signal
      setSignal(prev => {
        const delta = (Math.random() - 0.5) * 2;
        return Math.min(100, Math.max(85, prev + delta));
      });
    }, 1000);

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className={`hud-container ${thermalMode ? 'thermal-hud' : ''}`}>
      {/* Top Left: Archive Record & Signal */}
      <div className="hud-top-left">
        <div className="hud-metric">WORTHLESS ARCHIVE // RECORD: {sessionID}</div>
        <div className="hud-metric flex-items-center">
          ARCHIVE SIGNAL: {signal.toFixed(1)}%
          <div className="signal-bars">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className={`signal-bar ${signal > (i * 20 - 10) ? 'active' : ''}`}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Right: Archive Condition */}
      <div className="hud-top-right">
        <div className="hud-metric">DEPTH INDEX: {dataSpeed}</div>
        <div className="hud-metric">CONDITION: {thermalMode ? 'SURVEYING' : 'STABLE'}</div>
      </div>

      {/* Bottom Left: Archive Activity */}
      <div className="hud-bottom-left">
        <div className="system-logs">
          {logs.map((log, index) => (
            <div key={index} className="log-line">{`— ${log}`}</div>
          ))}
        </div>
        <div className="hud-metric mt-2">LAT: 41.0082° N // LON: 28.9784° E</div>
      </div>

      {/* Bottom Right: Clock & Position */}
      <div className="hud-bottom-right">
        <div className="hud-metric">{currentTime}</div>
        <div className="hud-metric">
          X: {coords.x.toString().padStart(4, '0')} // Y: {coords.y.toString().padStart(4, '0')}
        </div>
        <div className="hud-metric scroll-metric">
          ARCHIVE DEPTH: {scrollProgress.toFixed(1)}%
        </div>
      </div>

      {/* Center Reticle (Subtle) */}
      <div className="hud-reticle">
        <div className="reticle-v"></div>
        <div className="reticle-h"></div>
      </div>
    </div>
  );
};

export default InteractiveHUD;
