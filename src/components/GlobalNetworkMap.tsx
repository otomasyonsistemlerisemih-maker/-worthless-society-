"use client";

import React, { useEffect, useRef, useState } from 'react';

interface Node {
  name: string;
  lat: string;
  lon: string;
  xPercent: number; // percentage of canvas width
  yPercent: number; // percentage of canvas height
  status: 'ACTIVE' | 'STANDBY' | 'ENCRYPTED' | 'RESTRICTED';
  ping: number;
}

const INITIAL_NODES: Node[] = [
  { name: "ISTANBUL_NODE_01", lat: "41.0082 N", lon: "28.9784 E", xPercent: 55, yPercent: 42, status: "ACTIVE", ping: 12 },
  { name: "BERLIN_NODE_09", lat: "52.5200 N", lon: "13.4050 E", xPercent: 48, yPercent: 33, status: "ACTIVE", ping: 24 },
  { name: "TOKYO_NODE_04", lat: "35.6762 N", lon: "139.6503 E", xPercent: 85, yPercent: 45, status: "ENCRYPTED", ping: 88 },
  { name: "NEW_YORK_NODE_12", lat: "40.7128 N", lon: "74.0060 W", xPercent: 25, yPercent: 40, status: "STANDBY", ping: 45 },
  { name: "LONDON_NODE_02", lat: "51.5074 N", lon: "0.1278 W", xPercent: 44, yPercent: 35, status: "ACTIVE", ping: 18 },
  { name: "REYKJAVIK_NODE_07", lat: "64.1466 N", lon: "21.9426 W", xPercent: 38, yPercent: 22, status: "ACTIVE", ping: 110 },
  { name: "SYDNEY_NODE_08", lat: "33.8688 S", lon: "151.2093 E", xPercent: 90, yPercent: 80, status: "STANDBY", ping: 142 },
  { name: "VOID_NODE_009", lat: "??.???? N", lon: "??.???? E", xPercent: 62, yPercent: 58, status: "RESTRICTED", ping: 0 }
];

interface GlobalNetworkMapProps {
  thermalMode: boolean;
}

const GlobalNetworkMap: React.FC<GlobalNetworkMapProps> = ({ thermalMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Add real-time stream logs
  useEffect(() => {
    const logs = [
      "ESTABLISHING SECURE MULTI-NODE LINK...",
      "ISTANBUL_NODE_01: PACKET_BURST_STABLE [12ms]",
      "TOKYO_NODE_04: RE-ROUTING COMPARTMENT 009 TRAFFIC",
      "WARNING: CORRUPTED DATASTREAM AT LONDON_NODE_02",
      "VOID_NODE_009: STATUS UNKNOWN // RESTRICTED",
      "BERLIN_NODE_09: SEEDING NEW CRYPT_BUFFER",
      "NEW_YORK_NODE_12: ENCRYPTING TELEMETRY HEADER",
      "REYKJAVIK_NODE_07: SYSTEM TEMPERATURE 4.2K",
      "UPLINK DECRYPTED ON FREQUENCY 440HZ"
    ];

    const interval = setInterval(() => {
      setConsoleLogs(prev => {
        const next = [...prev, logs[Math.floor(Math.random() * logs.length)]];
        if (next.length > 8) return next.slice(1);
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let scanY = 0;

    const resizeCanvas = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = 450;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse interactive tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });

      // Find closest node
      let foundNode: Node | null = null;
      INITIAL_NODES.forEach(node => {
        const nx = (node.xPercent / 100) * canvas.width;
        const ny = (node.yPercent / 100) * canvas.height;
        const dist = Math.hypot(x - nx, y - ny);
        if (dist < 15) {
          foundNode = node;
        }
      });
      setSelectedNode(foundNode);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Determine palette
      const primaryColor = thermalMode ? '#ff9e00' : '#E8E8E8';
      const accentColor = thermalMode ? '#ff9e00' : '#00b4d8';
      const alertColor = '#ff3333';
      const gridColor = thermalMode ? 'rgba(255, 158, 0, 0.05)' : 'rgba(232, 232, 232, 0.05)';

      // 1. Draw Grid Background
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 2. Draw Scanning Radar Sweeper
      scanY = (scanY + 1.5) % canvas.height;
      ctx.strokeStyle = thermalMode ? 'rgba(255, 158, 0, 0.15)' : 'rgba(0, 180, 216, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();

      // 3. Draw Inter-node Web Connections
      ctx.lineWidth = 0.5;
      INITIAL_NODES.forEach((nodeA, index) => {
        INITIAL_NODES.slice(index + 1).forEach(nodeB => {
          // Connect only close nodes to make it look like a neural mesh
          const distPercent = Math.hypot(nodeA.xPercent - nodeB.xPercent, nodeA.yPercent - nodeB.yPercent);
          if (distPercent < 45) {
            const ax = (nodeA.xPercent / 100) * canvas.width;
            const ay = (nodeA.yPercent / 100) * canvas.height;
            const bx = (nodeB.xPercent / 100) * canvas.width;
            const by = (nodeB.yPercent / 100) * canvas.height;

            const isRestricted = nodeA.status === 'RESTRICTED' || nodeB.status === 'RESTRICTED';

            ctx.strokeStyle = isRestricted 
              ? 'rgba(255, 51, 51, 0.15)' 
              : thermalMode ? 'rgba(255, 158, 0, 0.15)' : 'rgba(232, 232, 232, 0.15)';
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      });

      // 4. Draw Individual Nodes
      INITIAL_NODES.forEach(node => {
        const nx = (node.xPercent / 100) * canvas.width;
        const ny = (node.yPercent / 100) * canvas.height;
        const time = Date.now() * 0.003;

        // Node Color Mapping
        let color = accentColor;
        if (node.status === 'RESTRICTED') color = alertColor;
        else if (node.status === 'ENCRYPTED') color = thermalMode ? '#ff9e00' : '#888888';

        // Outer pulsing ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const pulseRadius = 5 + Math.sin(time + node.xPercent) * 4;
        ctx.arc(nx, ny, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner solid core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fill();

        // Node Metadata Overlay (on Hover)
        const isHovered = selectedNode?.name === node.name;
        if (isHovered) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(nx, ny, 12, 0, Math.PI * 2);
          ctx.stroke();

          // Target grid overlay
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.beginPath();
          ctx.moveTo(nx - 20, ny);
          ctx.lineTo(nx + 20, ny);
          ctx.moveTo(nx, ny - 20);
          ctx.lineTo(nx, ny + 20);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [thermalMode, selectedNode]);

  return (
    <div ref={containerRef} className="network-map-section">
      <div className="telemetry-grid">
        {/* Real-time terminal stream (Sidebar) */}
        <div className="telemetry-logs-panel">
          <div className="panel-header">
            <span className="rec-dot"></span>
            SYS_TELEMETRY // STREAM_RX
          </div>
          <div className="logs-container">
            {consoleLogs.map((log, index) => (
              <div key={index} className="log-entry">
                <span className="timestamp">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span> {log}
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Canvas Constellation Map */}
        <div className="canvas-wrapper">
          <canvas ref={canvasRef} />
          
          {/* Snap-on Target Stats Overlay */}
          {selectedNode && (
            <div 
              className={`node-stats-overlay ${thermalMode ? 'thermal-overlay-card' : ''}`}
              style={{
                position: 'absolute',
                left: `${(selectedNode.xPercent / 100) * 100}%`,
                top: `${(selectedNode.yPercent / 100) * 100 + 4}%`,
                transform: 'translate(-50%, 10px)'
              }}
            >
              <div className="corner-tag top-left"></div>
              <div className="corner-tag top-right"></div>
              <div className="corner-tag bottom-left"></div>
              <div className="corner-tag bottom-right"></div>
              
              <div className="overlay-header">{selectedNode.name}</div>
              <div className="overlay-line">COORDS: {selectedNode.lat} / {selectedNode.lon}</div>
              <div className="overlay-line">PING: {selectedNode.ping === 0 ? 'N/A' : `${selectedNode.ping}ms`}</div>
              <div className="overlay-line">
                SEC_STATUS: <span className={selectedNode.status === 'RESTRICTED' ? 'status-restricted' : 'status-active'}>
                  {selectedNode.status}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalNetworkMap;
