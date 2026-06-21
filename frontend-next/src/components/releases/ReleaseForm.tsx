'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

interface ReleaseFormProps {
  onCreated: () => void;
  onClose:   () => void;
}

export default function ReleaseForm({ onCreated, onClose }: ReleaseFormProps) {
  const [version,     setVersion]     = useState('');
  const [summary,     setSummary]     = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!version.trim()) { setError('Version is required'); return; }
    setSaving(true);
    setError('');
    try {
      await api.createRelease({ version: version.trim(), summary: summary.trim(), releaseDate: releaseDate || undefined });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create release');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2>New Release</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal__body">
          <div className="field">
            <label htmlFor="rel-version">Version *</label>
            <input id="rel-version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1.2.0" />
          </div>
          <div className="field">
            <label htmlFor="rel-summary">Summary</label>
            <textarea id="rel-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="What's in this release?" />
          </div>
          <div className="field">
            <label htmlFor="rel-date">Release Date</label>
            <input id="rel-date" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
          </div>
          {error && <p className="error">{error}</p>}
          <div className="modal__footer">
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button" disabled={saving}>{saving ? 'Creating…' : 'Create Release'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
