# 🎬 Subtitle Creator AI

> **AI-Powered Video & Audio Transcript Generator with Interactive Subtitles**

A premium, full-featured web application that transforms video and audio files into interactive, searchable transcripts with professional subtitle exports. Built with React, TypeScript, and Vite — powered by AssemblyAI.

---

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Transcription** — Upload any video or audio file and get accurate, word-level transcriptions via AssemblyAI
- **Interactive Transcript** — Click any word to seek the media player to that exact moment
- **Real-Time Word Highlighting** — Currently spoken words are highlighted and auto-scrolled during playback
- **Speaker Diarization** — Identify and label different speakers (Speaker A, Speaker B, etc.)
- **AI Summary & Key Takeaways** — Automatically extract the most important sentences with clickable timestamps

### 📦 Subtitle Export Formats
- **SubRip (.srt)** — Industry-standard subtitle format compatible with all video players
- **WebVTT (.vtt)** — Modern web subtitle format for HTML5 `<video>` and `<track>` elements
- **Plain Text (.txt)** — Simple transcript download for documentation

### 🎨 Premium UI/UX
- **Dark & Light Theme Toggle** — Seamlessly switch between a cyberpunk dark glassmorphism theme and a clean light mode
- **Glassmorphic Design** — Frosted glass panels with translucent backgrounds and glowing neon borders
- **Rich Micro-Animations** — Entrance transitions, hover effects, floating background orbs, progress shimmer, and staggered reveals
- **Drag & Drop Upload** — Beautiful drop zone with animated hover states and file type validation
- **Responsive Layout** — Fully adaptive grid layout for desktop and tablet screens

### ⚙️ Configurable Settings
- **Custom API Key** — Supply your own AssemblyAI key (stored securely in localStorage)
- **Subtitle Line Length** — Control max characters per subtitle cue for SRT/VTT exports
- **Speaker Detection Toggle** — Enable/disable speaker identification per transcription

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 8 |
| **Styling** | Vanilla CSS with Custom Properties |
| **Icons** | Lucide React |
| **AI Engine** | AssemblyAI Transcription API |
| **Fonts** | Inter + Outfit (Google Fonts) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or later
- **npm** v9 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/deepakrajjs-29/mvp-subtitle-creater.git
cd mvp-subtitle-creater

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
mvp-subtitle-creater/
├── index.html                    # App entry point with Google Fonts
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
│
├── public/                       # Static assets
│
└── src/
    ├── main.tsx                  # React DOM mount
    ├── App.tsx                   # Main app orchestrator & state
    ├── index.css                 # Complete design system & animations
    │
    └── components/
        ├── UploadZone.tsx        # Drag & drop file upload
        ├── MediaPlayer.tsx       # Video/audio player with time sync
        ├── TranscriptViewer.tsx  # Interactive word-level transcript
        ├── SummaryPanel.tsx      # AI summary & key takeaways
        ├── SubtitleDownloader.tsx # SRT/VTT/TXT export engine
        └── SettingsModal.tsx     # API key & preferences config
```

---

## 🎥 How It Works

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Upload File │────▶│  AssemblyAI API  │────▶│  Word-Level Data │
│  (drag/drop) │     │  Transcription   │     │  + Timestamps    │
└──────────────┘     └─────────────────┘     └──────────────────┘
                                                       │
                           ┌───────────────────────────┤
                           ▼                           ▼
                  ┌─────────────────┐       ┌──────────────────┐
                  │   Interactive   │       │   SRT / VTT      │
                  │   Transcript    │       │   Subtitle Files  │
                  │   + Search      │       │   Export Engine   │
                  └─────────────────┘       └──────────────────┘
```

1. **Upload** — Drag and drop or browse for a video/audio file
2. **Process** — File is uploaded to AssemblyAI and transcribed with word-level timestamps
3. **Interact** — Browse the synced transcript, search for keywords, click words to seek
4. **Export** — Download professional subtitle files in SRT, VTT, or plain text format

---

## 🎨 Design Philosophy

The UI is built around a **cyberpunk glassmorphism** aesthetic with carefully crafted micro-animations:

- **Floating Orbs** — Background gradient orbs that drift slowly, creating depth
- **Staggered Entrance** — Components slide and fade in with sequential delays
- **Progress Shimmer** — Upload progress bar features a sweeping shimmer effect
- **Word Pulse** — Active transcript words glow and pulse during playback
- **Tab Underline Reveal** — Hover over tabs to see a glowing underline expand
- **Button Micro-Interactions** — Lift, glow, and scale effects on hover/click
- **Accessibility** — All animations respect `prefers-reduced-motion` for users who need it

---

## ⚡ Available Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run Oxlint for code quality |

---

## 🔑 API Configuration

By default, the app uses a built-in demo API key. For production use:

1. Get your API key from [AssemblyAI](https://www.assemblyai.com/)
2. Click the **⚙️ Settings** icon in the app header
3. Paste your key — it's saved securely in your browser's localStorage

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/deepakrajjs-29">Deepak Raj JS</a>
</p>
