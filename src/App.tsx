import { useState, useRef, useEffect } from 'react';
import { Settings, Film, CheckCircle, AlertCircle, Sun, Moon } from 'lucide-react';
import { UploadZone } from './components/UploadZone';
import { MediaPlayer } from './components/MediaPlayer';
import { TranscriptViewer } from './components/TranscriptViewer';
import type { Word, Utterance } from './components/TranscriptViewer';
import { SummaryPanel } from './components/SummaryPanel';
import { SettingsModal } from './components/SettingsModal';
import { SubtitleDownloader } from './components/SubtitleDownloader';

// Default API Key from original app
const DEFAULT_API_KEY = '4089c5a2c2884440b1e649570c4931a2';

function App() {
  // --- Persistent State (LocalStorage) ---
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('assembly_api_key') || DEFAULT_API_KEY;
  });
  const [maxCharsPerLine, setMaxCharsPerLine] = useState<number>(() => {
    const saved = localStorage.getItem('max_chars_per_line');
    return saved ? parseInt(saved, 10) : 40;
  });
  const [speakerDiarization, setSpeakerDiarization] = useState<boolean>(() => {
    return localStorage.getItem('speaker_diarization') === 'true';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  // Apply theme class to document root
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // --- UI & Application State ---
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');

  // --- Transcription Results ---
  const [words, setWords] = useState<Word[]>([]);
  const [utterances, setUtterances] = useState<Utterance[] | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);

  // --- Playback / Interaction State ---
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const playerRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  // Clean up object URL when file changes to avoid leaks
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Save key configurations to localStorage
  const handleSaveApiKey = (key: string) => {
    setApiKey(key || DEFAULT_API_KEY);
    localStorage.setItem('assembly_api_key', key);
  };

  const handleSaveMaxChars = (val: number) => {
    setMaxCharsPerLine(val);
    localStorage.setItem('max_chars_per_line', val.toString());
  };

  const handleToggleSpeakers = (val: boolean) => {
    setSpeakerDiarization(val);
    localStorage.setItem('speaker_diarization', val.toString());
  };

  // Seek video player to specific seconds
  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = seconds;
      playerRef.current.play().catch(() => {});
    }
  };

  // Main Upload and Transcription Workflow
  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);
    
    // Reset previous states
    setStatus('uploading');
    setProgress(10);
    setProgressText('Preparing file upload...');
    setWords([]);
    setUtterances(null);
    setSummaryText(null);
    setErrorMsg('');

    try {
      // Step 1: Upload file to AssemblyAI
      setProgressText('Uploading media to AssemblyAI (this might take a few moments)...');
      const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: { authorization: apiKey },
        body: selectedFile
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errData.error || `Upload failed with status code ${uploadRes.status}`);
      }

      const uploadData = await uploadRes.json();
      const uploadUrl = uploadData.upload_url;

      setProgress(40);
      setProgressText('Media uploaded. Initializing transcription request...');

      // Step 2: Request transcription (enable smart features: diarization, summary)
      const requestBody = {
        audio_url: uploadUrl,
        punctuate: true,
        speaker_labels: speakerDiarization,
        summarization: true,
        summary_model: "informative",
        summary_type: "bullets"
      };

      const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!transcriptRes.ok) {
        const errData = await transcriptRes.json().catch(() => ({ error: 'Transcription request failed' }));
        throw new Error(errData.error || `Transcription request failed with status ${transcriptRes.status}`);
      }

      const transcriptData = await transcriptRes.json();
      const transcriptId = transcriptData.id;

      setStatus('transcribing');
      setProgress(50);
      setProgressText('AssemblyAI is processing. Waiting in queue...');

      // Step 3: Poll for status updates
      let completed = false;
      let pollCount = 0;
      let finalData: any = null;

      while (!completed) {
        // Wait 3 seconds before polling
        await new Promise(res => setTimeout(res, 3000));
        pollCount++;

        const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: { authorization: apiKey }
        });

        if (!poll.ok) {
          throw new Error(`Failed to poll status with code ${poll.status}`);
        }

        finalData = await poll.json();

        // Increment progress bar incrementally to look active
        const simulatedProgress = Math.min(50 + Math.floor(pollCount * 2.5), 98);
        setProgress(simulatedProgress);

        if (finalData.status === "completed") {
          completed = true;
        } else if (finalData.status === "queued") {
          setProgressText('In queue, waiting for AssemblyAI runner...');
        } else if (finalData.status === "processing") {
          setProgressText('Transcribing audio & analyzing semantic patterns...');
        } else if (finalData.status === "error") {
          throw new Error(finalData.error || "Transcription failed unexpectedly.");
        }
      }

      // Step 4: Display and store results
      setProgress(100);
      setProgressText('Transcription & summarization finished successfully!');
      
      setWords(finalData.words || []);
      setUtterances(finalData.utterances || null);
      setSummaryText(finalData.summary || null);
      setStatus('completed');

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred during transcription.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setFile(null);
    setVideoUrl(null);
    setStatus('idle');
    setProgress(0);
    setProgressText('');
    setWords([]);
    setUtterances(null);
    setSummaryText(null);
    setErrorMsg('');
  };

  return (
    <div className="app-container">
      {/* Visual background accents */}
      <div className="glow-spot"></div>
      <div className="glow-spot-secondary"></div>

      {/* Top Navigation / Header */}
      <header>
        <div className="brand">
          <Film className="brand-icon" size={28} />
          <h1>Subtitle Creator <span style={{ color: 'var(--accent-secondary)' }}>AI</span></h1>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {status !== 'idle' && (
            <button className="btn btn-secondary" onClick={handleReset}>
              Reset Workspace
            </button>
          )}
          <button className="btn btn-secondary btn-icon" onClick={() => setIsSettingsOpen(true)} title="Settings">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        maxCharsPerLine={maxCharsPerLine}
        onSaveMaxChars={handleSaveMaxChars}
        speakerDiarization={speakerDiarization}
        onToggleSpeakers={handleToggleSpeakers}
      />

      {/* Interactive Main Workspace Grid */}
      <main className="dashboard-grid">
        
        {/* Left Side: Upload & Media Player Controls */}
        <div className="left-column">
          {status === 'idle' ? (
            <UploadZone onFileSelect={handleFileSelect} isLoading={false} />
          ) : (
            <MediaPlayer
              file={file}
              videoUrl={videoUrl}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              playerRef={playerRef}
            />
          )}

          {/* Progress Widget */}
          {(status === 'uploading' || status === 'transcribing') && (
            <div className="glass-panel progress-panel">
              <div className="progress-header">
                <span style={{ fontWeight: 600 }}>Processing Media</span>
                <span style={{ color: 'var(--accent-secondary)' }}>{progress}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-step-desc">
                {progressText}
              </div>
            </div>
          )}

          {/* Success / Finished Banner */}
          {status === 'completed' && (
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
              <div>
                <h5 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Processing Complete</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Interactive transcript is synchronized and subtitle tracks (.srt & .vtt) are generated.
                </p>
              </div>
            </div>
          )}

          {/* Error Widget */}
          {status === 'error' && (
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <h5 style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f87171' }}>Transcription Failed</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {errorMsg}
                </p>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => file && handleFileSelect(file)}>
                  Retry Transcription
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Tabbed Panel (Transcript & Keypoints/Summary) */}
        <div className="right-column">
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
            
            {/* Tabs Header */}
            <div className="tabs-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex' }}>
                <button
                  className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
                  onClick={() => setActiveTab('transcript')}
                >
                  Interactive Transcript
                </button>
                <button
                  className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setActiveTab('summary')}
                >
                  Summary & Keypoints
                </button>
              </div>

              {/* Subtitle Exporters */}
              {status === 'completed' && file && (
                <div style={{ paddingRight: '1rem' }}>
                  <SubtitleDownloader
                    words={words}
                    maxCharsPerLine={maxCharsPerLine}
                    filename={file.name}
                  />
                </div>
              )}
            </div>

            {/* Tab Body */}
            <div className="tab-content">
              {activeTab === 'transcript' ? (
                <TranscriptViewer
                  words={words}
                  utterances={utterances}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              ) : (
                <SummaryPanel
                  summaryText={summaryText}
                  words={words}
                  onSeek={handleSeek}
                />
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
