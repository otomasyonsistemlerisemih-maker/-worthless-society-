"use client";

import React, { useState } from 'react';

type FormState = 'idle' | 'success' | 'error';

const NetworkAccessForm: React.FC = () => {
  const [value, setValue] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed || !trimmed.includes('@')) {
      setFormState('error');
      return;
    }

    // Simulate async submission — replace with real endpoint if needed
    setFormState('success');
    setValue('');
  };

  return (
    <div className="network-access-form fade-in">

      <div className="network-access-inner">
        {formState === 'success' ? (
          <p className="network-access-message network-access-success">
            ACCESS REQUEST RECORDED.
          </p>
        ) : (
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
        )}

        {formState === 'error' && (
          <p className="network-access-message network-access-error">
            ACCESS ADDRESS REQUIRED.
          </p>
        )}

        <p className="network-access-note">
          Join the archive quietly.<br />
          No noise. No performance. Only endurance.
        </p>
      </div>

    </div>
  );
};

export default NetworkAccessForm;
