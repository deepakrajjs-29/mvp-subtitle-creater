import React, { useRef, useEffect } from 'react';
import { Film, Music } from 'lucide-react';

interface MediaPlayerProps {
  file: File | null;
  videoUrl: string | null;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  playerRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  file,
  videoUrl,
  onTimeUpdate,
  playerRef
}) => {
  const localPlayerRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  // Sync refs
  useEffect(() => {
    if (localPlayerRef.current) {
      playerRef.current = localPlayerRef.current;
    }
  }, [localPlayerRef.current]);

  if (!file || !videoUrl) {
    return (
      <div className="glass-panel media-section" style={{ height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <Film size={48} className="empty-state-icon" />
          <p>No media loaded</p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload an audio or video file to start transcription</span>
        </div>
      </div>
    );
  }

  const isAudio = file.type.startsWith('audio/');

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
    onTimeUpdate(e.currentTarget.currentTime);
  };

  return (
    <div className="glass-panel media-section">
      <div className="media-container" style={{ background: isAudio ? '#0f172a' : '#000' }}>
        {isAudio ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', padding: '2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: 'var(--accent-primary)',
              animation: 'pulse 2s infinite'
            }}>
              <Music size={32} />
            </div>
            <audio
              ref={(el) => {
                localPlayerRef.current = el;
              }}
              src={videoUrl}
              className="media-player"
              controls
              onTimeUpdate={handleTimeUpdate}
              style={{ width: '100%', height: '40px', marginTop: '1rem' }}
            />
          </div>
        ) : (
          <video
            ref={(el) => {
              localPlayerRef.current = el;
            }}
            src={videoUrl}
            className="media-player"
            controls
            onTimeUpdate={handleTimeUpdate}
          />
        )}
      </div>
      <div className="media-info">
        <div className="media-filename" title={file.name}>
          {file.name}
        </div>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--accent-secondary)',
          background: 'rgba(6, 182, 212, 0.1)',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontWeight: 600
        }}>
          {isAudio ? 'Audio Source' : 'Video Source'}
        </span>
      </div>
    </div>
  );
};
