import React, { useState } from 'react';
import { X, Key, Sliders, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  maxCharsPerLine: number;
  onSaveMaxChars: (val: number) => void;
  speakerDiarization: boolean;
  onToggleSpeakers: (val: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  maxCharsPerLine,
  onSaveMaxChars,
  speakerDiarization,
  onToggleSpeakers
}) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [localMaxChars, setLocalMaxChars] = useState(maxCharsPerLine);
  const [localSpeakers, setLocalSpeakers] = useState(speakerDiarization);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(localKey.trim());
    onSaveMaxChars(localMaxChars);
    onToggleSpeakers(localSpeakers);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={20} className="brand-icon" /> Settings & API Config
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Key size={16} /> AssemblyAI API Key
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your AssemblyAI API Key"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
            />
            <span className="form-help">
              Leave blank to use the built-in demo key. Your key is stored securely in your browser's local storage.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Max Characters Per Subtitle Line</label>
            <input
              type="number"
              className="form-input"
              min="10"
              max="100"
              value={localMaxChars}
              onChange={(e) => setLocalMaxChars(parseInt(e.target.value) || 40)}
            />
            <span className="form-help">
              Controls when subtitles will split into a new line/card in the SRT/VTT outputs. Recommended: 35-45.
            </span>
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              id="speakerDiarization"
              checked={localSpeakers}
              onChange={(e) => setLocalSpeakers(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <label htmlFor="speakerDiarization" style={{ fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer' }}>
                Enable Speaker Diarization
              </label>
              <div className="form-help">Identify and label different speakers (e.g. Speaker A, Speaker B).</div>
            </div>
          </div>

          {localSpeakers && (
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              background: 'rgba(234, 179, 8, 0.05)',
              border: '1px solid rgba(234, 179, 8, 0.15)',
              borderRadius: '8px',
              padding: '0.75rem',
              fontSize: '0.8rem',
              color: '#fef08a'
            }}>
              <AlertTriangle size={24} style={{ flexShrink: 0, color: '#eab308' }} />
              <div>
                Speaker detection is an advanced feature. If using your own key, make sure it is authorized for diarization transcription.
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
