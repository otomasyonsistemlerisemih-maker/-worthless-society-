"use client";

import React, { useState, useEffect } from 'react';

type FormState = 'idle' | 'success' | 'error';

interface ArchiveIdentity {
  id: string;
  classification: string;
  date: string;
  index: string;
}

const NetworkAccessForm: React.FC = () => {
  const [value, setValue] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [identity, setIdentity] = useState<ArchiveIdentity | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('worthless_archive_identity');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          setIdentity(parsed);
          setFormState('success');
        }
      } catch (e) {
        console.error("Failed to load archive identity", e);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed || !trimmed.includes('@')) {
      setFormState('error');
      return;
    }

    // Generate new Archive Identity Card
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    const archiveId = `W-${randomDigits}`;
    
    const classifications = [
      'SILENT ENDURANCE',
      'LOW VISIBILITY',
      'EMOTIONAL ARMOR',
      'PRESSURE FORMED',
      'QUIET SURVIVAL',
      'VOID RESISTANCE',
      'INTERNAL PRESSURE',
      'ABSENT SIGNAL'
    ];
    const classification = classifications[Math.floor(Math.random() * classifications.length)];
    const currentYear = new Date().getFullYear().toString();
    
    const newIdentity: ArchiveIdentity = {
      id: archiveId,
      classification: classification,
      date: currentYear,
      index: 'GLOBAL_VOID_NETWORK'
    };

    localStorage.setItem('worthless_archive_identity', JSON.stringify(newIdentity));
    setIdentity(newIdentity);
    setFormState('success');
    setValue('');
  };

  const handleCopy = () => {
    if (identity) {
      navigator.clipboard.writeText(identity.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="network-access-form fade-in">
      <div className="network-access-inner">
        {formState === 'success' && identity ? (
          <div className="archive-identity-card">
            <div className="archive-card-header">
              <span className="archive-card-marker">WORTHLESS / INDEXED</span>
              <span className="archive-card-status-dot"></span>
            </div>
            
            <div className="archive-card-divider" />
            
            <div className="archive-card-body">
              <div className="archive-card-row entry-status">
                <span className="archive-card-label highlight">ENTRY RECORDED</span>
              </div>
              <div className="archive-card-row detail-row">
                <span className="archive-card-label">ARCHIVE ID:</span>
                <span className="archive-card-value font-mono highlight">{identity.id}</span>
              </div>
              <div className="archive-card-row detail-row">
                <span className="archive-card-label">STATUS:</span>
                <span className="archive-card-value">RECORDED</span>
              </div>
              <div className="archive-card-row detail-row">
                <span className="archive-card-label">CLASSIFICATION:</span>
                <span className="archive-card-value">{identity.classification}</span>
              </div>
              <div className="archive-card-row detail-row">
                <span className="archive-card-label">ENTRY DATE:</span>
                <span className="archive-card-value">{identity.date}</span>
              </div>
              <div className="archive-card-row detail-row">
                <span className="archive-card-label">INDEX:</span>
                <span className="archive-card-value">{identity.index}</span>
              </div>
            </div>
            
            <div className="archive-card-divider" />
            
            <div className="archive-card-footer">
              <p className="archive-card-msg">YOU ARE NOW PART OF THE INDEX.</p>
              
              <button 
                onClick={handleCopy} 
                className="archive-card-copy-btn"
              >
                {copied ? 'ARCHIVE ID COPIED.' : 'COPY ARCHIVE ID'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="network-access-fields">
              <input
                type="email"
                value={value}
                onChange={e => { setValue(e.target.value); setFormState('idle'); }}
                placeholder="enter access address"
                className="network-access-input"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className="network-access-btn">
                REQUEST ACCESS
              </button>
            </form>

            {formState === 'error' && (
              <p className="network-access-message network-access-error">
                ACCESS ADDRESS REQUIRED.
              </p>
            )}

            <p className="network-access-note">
              Join the archive quietly.<br />
              No noise. No performance. Only endurance.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkAccessForm;
