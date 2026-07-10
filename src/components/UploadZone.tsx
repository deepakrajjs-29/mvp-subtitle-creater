import React, { useState, useRef } from 'react';
import { UploadCloud, FileVideo, FileAudio } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['video/', 'audio/'];
    const isValid = validTypes.some((type) => file.type.startsWith(type));
    if (!isValid) {
      alert('Invalid file format. Please upload an audio or video file.');
      return false;
    }
    return true;
  };

  const triggerFileInput = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`glass-panel upload-container ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={triggerFileInput}
      style={{ pointerEvents: isLoading ? 'none' : 'auto', opacity: isLoading ? 0.6 : 1 }}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="file-input"
        accept="audio/*,video/*"
        onChange={handleFileInput}
        disabled={isLoading}
      />
      <div className="upload-icon">
        <UploadCloud size={48} />
      </div>
      <h4 className="upload-title">Drag & Drop your media file</h4>
      <p className="upload-subtitle">Supports MP4, MOV, MKV, MP3, WAV, M4A, etc.</p>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
          <FileVideo size={14} /> Video files
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
          <FileAudio size={14} /> Audio files
        </span>
      </div>
    </div>
  );
};
