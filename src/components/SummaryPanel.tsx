import React from 'react';
import { List, Sparkles, Play } from 'lucide-react';
import type { Word } from './TranscriptViewer';

interface SummaryPanelProps {
  summaryText: string | null;
  words: Word[];
  onSeek: (seconds: number) => void;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summaryText,
  words,
  onSeek
}) => {
  // Helper: Find the timestamp of a sentence by matching its first few words
  const findSentenceTimestamp = (sentence: string): number => {
    if (words.length === 0) return 0;
    
    // clean sentence and get first 3 words
    const cleanWord = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
    const sentenceWords = sentence.split(/\s+/).map(cleanWord).filter(Boolean);
    
    if (sentenceWords.length === 0) return 0;
    
    // Scan words array for matches
    for (let i = 0; i < words.length - 2; i++) {
      if (
        cleanWord(words[i].text) === sentenceWords[0] &&
        (sentenceWords.length < 2 || cleanWord(words[i+1].text) === sentenceWords[1]) &&
        (sentenceWords.length < 3 || cleanWord(words[i+2].text) === sentenceWords[2])
      ) {
        return words[i].start / 1000;
      }
    }
    
    // Fallback: match first word only
    const idx = words.findIndex(w => cleanWord(w.text) === sentenceWords[0]);
    return idx !== -1 ? words[idx].start / 1000 : 0;
  };

  // Extract key sentences dynamically if no summary is returned by AssemblyAI
  const extractKeySentences = (): string[] => {
    if (words.length === 0) return [];
    
    // Reconstruct full text
    const fullText = words.map(w => w.text).join(' ');
    
    // Split into sentences
    const sentences = fullText.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 15);
    
    // Rule-based heuristic: Get the longest and most informative sentences
    // Sort by length, slice top 5, then sort them back chronologically based on their original order
    const sentenceWithIndex = sentences.map((text, index) => ({ text, index }));
    const longest = [...sentenceWithIndex].sort((a, b) => b.text.length - a.text.length).slice(0, 5);
    
    return longest.sort((a, b) => a.index - b.index).map(s => s.text);
  };

  const keyPoints = extractKeySentences();

  if (words.length === 0) {
    return (
      <div className="empty-state">
        <Sparkles size={48} className="empty-state-icon" />
        <p>No summary insights yet</p>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI summaries and key points will appear here once your media is transcribed.</span>
      </div>
    );
  }

  return (
    <div className="summary-container">
      {summaryText ? (
        <div className="summary-card">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} /> AI Executive Summary
          </h4>
          <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
            {summaryText}
          </p>
        </div>
      ) : (
        <div className="summary-card" style={{
          background: 'radial-gradient(100% 100% at 0% 0%, rgba(99, 102, 241, 0.05) 0%, rgba(13, 20, 38, 0.1) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.1)'
        }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)' }}>
            <Sparkles size={16} /> AI Summary Status
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            To get AI-generated executive summaries, you can toggle Summarization in your transcriber settings. Below are the key sentences extracted from your transcript.
          </p>
        </div>
      )}

      <div className="summary-card">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <List size={16} /> Key Takeaways (Interactive)
        </h4>
        <ul className="keypoints-list" style={{ marginTop: '0.75rem' }}>
          {keyPoints.map((sentence, idx) => {
            const time = findSentenceTimestamp(sentence);
            return (
              <li
                key={idx}
                className="keypoint-item"
                style={{
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}
                onClick={() => onSeek(time)}
                title="Click to jump to this point in player"
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  marginRight: '0.5rem',
                  flexShrink: 0,
                  color: 'var(--accent-primary)'
                }}>
                  <Play size={10} style={{ marginLeft: '1px' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0 }}>
                    {sentence}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>
                    Jump to {Math.floor(time / 60)}:{(Math.floor(time % 60)).toString().padStart(2, '0')}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
