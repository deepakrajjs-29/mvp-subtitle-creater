import React, { useEffect, useRef, useState } from 'react';
import { Search, Check } from 'lucide-react';

export interface Word {
  text: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: string;
}

export interface Utterance {
  speaker: string;
  text: string;
  words: Word[];
  start: number;
  end: number;
}

interface TranscriptViewerProps {
  words: Word[];
  utterances: Utterance[] | null;
  currentTime: number;
  onSeek: (seconds: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  words,
  utterances,
  currentTime,
  onSeek,
  searchTerm,
  onSearchChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);

  const currentTimeMs = currentTime * 1000;

  // Auto scroll logic
  useEffect(() => {
    if (autoScroll && activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTimeMs, autoScroll]);

  // Format time (ms to mm:ss)
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Helper: Checks if a word is active
  const isWordActive = (word: Word) => {
    return currentTimeMs >= word.start && currentTimeMs <= word.end;
  };

  // Helper: Checks if word matches search term
  const isWordMatch = (word: Word) => {
    if (!searchTerm.trim()) return false;
    return word.text.toLowerCase().includes(searchTerm.toLowerCase().trim());
  };

  // Grouping raw words into paragraph-style sentences if there are no utterances
  const getParagraphs = () => {
    if (utterances && utterances.length > 0) {
      return utterances.map((utt, idx) => ({
        id: `utt-${idx}`,
        speaker: `Speaker ${utt.speaker}`,
        start: utt.start,
        words: utt.words
      }));
    }

    // fallback: Group words into paragraphs of roughly 15 words or until punctuation ends
    const paragraphs: { id: string; speaker: string | null; start: number; words: Word[] }[] = [];
    let currentGroup: Word[] = [];
    let groupStart = 0;

    words.forEach((word, idx) => {
      if (currentGroup.length === 0) {
        groupStart = word.start;
      }
      currentGroup.push(word);

      const hasPunctuation = /[.!?]$/.test(word.text);
      if ((currentGroup.length >= 20 || hasPunctuation) && currentGroup.length > 5) {
        paragraphs.push({
          id: `para-${idx}`,
          speaker: null,
          start: groupStart,
          words: currentGroup
        });
        currentGroup = [];
      }
    });

    if (currentGroup.length > 0) {
      paragraphs.push({
        id: 'para-last',
        speaker: null,
        start: groupStart,
        words: currentGroup
      });
    }

    return paragraphs;
  };

  const paragraphs = getParagraphs();

  if (words.length === 0) {
    return (
      <div className="empty-state">
        <p>No transcript available</p>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload and transcribe a file to view the interactive text here.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search and AutoScroll Panel */}
      <div className="transcript-actions">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search size={16} className="search-icon-svg" />
        </div>
        
        <button
          className={`btn ${autoScroll ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setAutoScroll(!autoScroll)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '40px' }}
        >
          {autoScroll && <Check size={16} />}
          <span>Auto-Scroll</span>
        </button>
      </div>

      {/* Transcript Scrolling Body */}
      <div className="transcript-body" ref={containerRef}>
        {paragraphs.map((p) => (
          <div key={p.id} className="transcript-segment">
            <div
              className="timestamp-badge"
              onClick={() => onSeek(p.start / 1000)}
              title={`Click to seek to ${formatTime(p.start)}`}
            >
              {formatTime(p.start)}
            </div>

            <div className="segment-words">
              {p.speaker && (
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '0.2rem',
                  letterSpacing: '0.05em'
                }}>
                  {p.speaker}
                </div>
              )}
              <span>
                {p.words.map((word, wIdx) => {
                  const active = isWordActive(word);
                  const matched = isWordMatch(word);
                  return (
                    <span
                      key={wIdx}
                      ref={active ? activeWordRef : null}
                      className={`word-span ${active ? 'highlighted' : ''} ${matched ? 'search-matched' : ''}`}
                      onClick={() => onSeek(word.start / 1000)}
                    >
                      {word.text}{' '}
                    </span>
                  );
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
