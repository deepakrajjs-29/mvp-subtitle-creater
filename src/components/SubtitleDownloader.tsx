import React, { useState } from 'react';
import { Download, FileText, FileVideo, ChevronDown } from 'lucide-react';
import type { Word } from './TranscriptViewer';

interface SubtitleDownloaderProps {
  words: Word[];
  maxCharsPerLine: number;
  filename: string;
}

interface SubtitleCue {
  index: number;
  startTime: number; // ms
  endTime: number; // ms
  text: string;
}

export const SubtitleDownloader: React.FC<SubtitleDownloaderProps> = ({
  words,
  maxCharsPerLine,
  filename
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Time formatter helpers
  const formatTimeSRT = (ms: number): string => {
    const pad = (num: number, size: number) => String(num).padStart(size, '0');
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`;
  };

  const formatTimeVTT = (ms: number): string => {
    const pad = (num: number, size: number) => String(num).padStart(size, '0');
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(milliseconds, 3)}`;
  };

  // Convert raw words into structured subtitle cues based on max characters/time limits
  const generateCues = (): SubtitleCue[] => {
    if (words.length === 0) return [];

    const cues: SubtitleCue[] = [];
    let cueIndex = 1;
    let currentCue: SubtitleCue = {
      index: cueIndex,
      startTime: words[0].start,
      endTime: words[0].end,
      text: words[0].text
    };

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const timeGap = word.start - currentCue.endTime;
      const potentialText = currentCue.text + ' ' + word.text;
      const duration = word.end - currentCue.startTime;

      // Split conditions:
      // 1. Exceeds character length limit
      // 2. A long pause between words (e.g. > 1.2 seconds)
      // 3. Caption duration exceeds 5 seconds
      if (
        potentialText.length > maxCharsPerLine ||
        timeGap > 1200 ||
        duration > 5000
      ) {
        cues.push(currentCue);
        cueIndex++;
        currentCue = {
          index: cueIndex,
          startTime: word.start,
          endTime: word.end,
          text: word.text
        };
      } else {
        currentCue.text = potentialText;
        currentCue.endTime = word.end;
      }
    }

    cues.push(currentCue);
    return cues;
  };

  // Generate SRT content
  const generateSRT = (cues: SubtitleCue[]): string => {
    return cues
      .map((cue) => {
        return `${cue.index}\n${formatTimeSRT(cue.startTime)} --> ${formatTimeSRT(cue.endTime)}\n${cue.text}\n`;
      })
      .join('\n');
  };

  // Generate VTT content
  const generateVTT = (cues: SubtitleCue[]): string => {
    const header = 'WEBVTT\n\n';
    const body = cues
      .map((cue) => {
        return `${cue.index}\n${formatTimeVTT(cue.startTime)} --> ${formatTimeVTT(cue.endTime)}\n${cue.text}\n`;
      })
      .join('\n');
    return header + body;
  };

  // Generate TXT content
  const generateTXT = (): string => {
    return words.map((w) => w.text).join(' ');
  };

  // Trigger download process
  const triggerDownload = (content: string, ext: string) => {
    const cleanFilename = filename.substring(0, filename.lastIndexOf('.')) || filename || 'transcript';
    const mimeType = ext === 'txt' ? 'text/plain' : 'text/vtt';
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanFilename}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleDownload = (format: 'srt' | 'vtt' | 'txt') => {
    const cues = generateCues();
    if (format === 'srt') {
      triggerDownload(generateSRT(cues), 'srt');
    } else if (format === 'vtt') {
      triggerDownload(generateVTT(cues), 'vtt');
    } else {
      triggerDownload(generateTXT(), 'txt');
    }
  };

  if (words.length === 0) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn btn-primary"
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <Download size={18} />
        <span>Export Subtitles</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 40
            }}
            onClick={() => setIsOpen(false)}
          />
          <div className="dropdown-menu">
            <button
              onClick={() => handleDownload('srt')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '0.6rem 0.75rem',
                textAlign: 'left',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
              className="tab-btn-hover"
            >
              <FileVideo size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>Download SubRip (.srt)</span>
            </button>
            
            <button
              onClick={() => handleDownload('vtt')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '0.6rem 0.75rem',
                textAlign: 'left',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
              className="tab-btn-hover"
            >
              <FileVideo size={16} style={{ color: 'var(--accent-secondary)' }} />
              <span>Download WebVTT (.vtt)</span>
            </button>

            <button
              onClick={() => handleDownload('txt')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '0.6rem 0.75rem',
                textAlign: 'left',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
              className="tab-btn-hover"
            >
              <FileText size={16} style={{ color: 'var(--text-secondary)' }} />
              <span>Download Plain Text (.txt)</span>
            </button>
          </div>
        </>
      )}

      {/* Add a inline hover script/style helper for options */}
      <style>{`
        .tab-btn-hover:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>
    </div>
  );
};
