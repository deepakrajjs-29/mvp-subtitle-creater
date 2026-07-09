/* ============================================================
   SubForge — AI-Powered Subtitle Creator
   Clean, Professional Architecture
   ============================================================ */

const FFMPEG_CDN = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
let ffmpegModule = null;

async function loadFFmpegLib() {
  if (ffmpegModule) return ffmpegModule;
  if (!window.FFmpeg) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = FFMPEG_CDN;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const { createFFmpeg, fetchFile } = window.FFmpeg;
  ffmpegModule = { createFFmpeg, fetchFile, instance: createFFmpeg({ log: false }) };
  return ffmpegModule;
}

// ── Toast ──────────────────────────────────────────────────
const Toast = {
  container: null,
  init() { this.container = document.getElementById('toastContainer'); },

  show(message, type = 'info', duration = 3500) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-dot"></span><span class="toast-msg">${message}</span>`;
    this.container.appendChild(el);
    setTimeout(() => {
      el.classList.add('removing');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  },

  success(m, d) { this.show(m, 'success', d); },
  error(m, d) { this.show(m, 'error', d); },
  warning(m, d) { this.show(m, 'warning', d); },
  info(m, d) { this.show(m, 'info', d); },
};

// ── Settings ───────────────────────────────────────────────
const Settings = {
  KEY: 'subforge_settings',
  defaults: { apiKey: '', language: 'en', model: 'openai/whisper-base' },

  load() {
    try {
      const s = localStorage.getItem(this.KEY);
      return s ? { ...this.defaults, ...JSON.parse(s) } : { ...this.defaults };
    } catch { return { ...this.defaults }; }
  },

  save(s) { localStorage.setItem(this.KEY, JSON.stringify(s)); },
  get(k) { return this.load()[k]; },
};

// ── Onboarding ─────────────────────────────────────────────
const Onboarding = {
  section: null,
  card: null,
  input: null,
  badge: null,
  titleEl: null,
  status: null,

  init() {
    this.section = document.getElementById('onboardingSection');
    this.card = document.getElementById('onboardingCard');
    this.input = document.getElementById('onboardingKeyInput');
    this.badge = document.getElementById('onboardingBadge');
    this.titleEl = document.getElementById('onboardingTitleText');
    this.status = document.getElementById('onboardingStatus');

    document.getElementById('onboardingSaveBtn').addEventListener('click', () => this.saveKey());

    // Pre-fill if key exists
    const key = Settings.get('apiKey');
    if (key) {
      this.input.value = key;
      this.showComplete();
    }
  },

  async saveKey() {
    const key = this.input.value.trim();
    if (!key) {
      this.showStatus('Please paste your API key above.', false);
      return;
    }

    if (!key.startsWith('hf_')) {
      this.showStatus('Key should start with hf_. Check your HuggingFace token.', false);
      return;
    }

    this.showStatus('Validating...', null);

    try {
      const resp = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: { 'Authorization': `Bearer ${key}` },
      });

      if (resp.ok) {
        const data = await resp.json();
        Settings.save({ ...Settings.load(), apiKey: key });
        this.showStatus(`Connected as ${data.name || data.fullname || 'user'}`, true);
        this.showComplete();
        Toast.success('API key saved — you\'re ready to transcribe!');
      } else {
        this.showStatus('Invalid key. Please check and try again.', false);
      }
    } catch {
      // Save anyway if network test fails
      Settings.save({ ...Settings.load(), apiKey: key });
      this.showStatus('Saved (could not verify — check your connection)', true);
      this.showComplete();
    }
  },

  showComplete() {
    this.card.classList.add('complete');
    this.badge.textContent = '✓';
    this.badge.classList.add('done');
    this.titleEl.textContent = 'Whisper AI connected';
  },

  showStatus(msg, ok) {
    this.status.classList.remove('hidden', 'success', 'error');
    if (ok === true) this.status.classList.add('success');
    else if (ok === false) this.status.classList.add('error');
    this.status.textContent = msg;
  },
};

// ── Settings Modal ─────────────────────────────────────────
const SettingsModal = {
  modal: null, apiInput: null, langSelect: null, modelSelect: null, keyStatus: null,

  init() {
    this.modal = document.getElementById('settingsModal');
    this.apiInput = document.getElementById('apiKeyInput');
    this.langSelect = document.getElementById('languageSelect');
    this.modelSelect = document.getElementById('modelSelect');
    this.keyStatus = document.getElementById('keyStatus');

    const s = Settings.load();
    this.apiInput.value = s.apiKey;
    this.langSelect.value = s.language;
    this.modelSelect.value = s.model;

    document.getElementById('settingsBtn').addEventListener('click', () => this.open());
    document.getElementById('closeModalBtn').addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('visible')) this.close();
    });

    document.getElementById('toggleKeyVisibility').addEventListener('click', () => {
      this.apiInput.type = this.apiInput.type === 'password' ? 'text' : 'password';
    });

    document.getElementById('testKeyBtn').addEventListener('click', () => this.testKey());
    document.getElementById('saveSettingsBtn').addEventListener('click', () => this.save());
  },

  open() {
    const s = Settings.load();
    this.apiInput.value = s.apiKey;
    this.langSelect.value = s.language;
    this.modelSelect.value = s.model;
    this.keyStatus.classList.add('hidden');
    this.modal.classList.add('visible');
  },

  close() { this.modal.classList.remove('visible'); },

  save() {
    Settings.save({
      apiKey: this.apiInput.value.trim(),
      language: this.langSelect.value,
      model: this.modelSelect.value,
    });
    // Sync onboarding
    if (this.apiInput.value.trim()) {
      Onboarding.input.value = this.apiInput.value.trim();
      Onboarding.showComplete();
    }
    Toast.success('Settings saved');
    this.close();
  },

  async testKey() {
    const key = this.apiInput.value.trim();
    if (!key) { this.showKey('Enter an API key first.', false); return; }
    this.showKey('Testing...', null);
    try {
      const r = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      if (r.ok) {
        const d = await r.json();
        this.showKey(`Valid — ${d.name || d.fullname || 'user'}`, true);
      } else {
        this.showKey('Invalid API key', false);
      }
    } catch { this.showKey('Connection error', false); }
  },

  showKey(msg, ok) {
    this.keyStatus.classList.remove('hidden', 'success', 'error');
    if (ok === true) this.keyStatus.classList.add('success');
    else if (ok === false) this.keyStatus.classList.add('error');
    this.keyStatus.textContent = msg;
  },
};

// ── File Uploader ──────────────────────────────────────────
const FileUploader = {
  zone: null, input: null, preview: null, selectedFile: null,

  init() {
    this.zone = document.getElementById('uploadZone');
    this.input = document.getElementById('videoInput');
    this.preview = document.getElementById('filePreview');

    document.getElementById('browseLink').addEventListener('click', (e) => { e.stopPropagation(); this.input.click(); });
    this.zone.addEventListener('click', () => this.input.click());
    this.input.addEventListener('change', () => { if (this.input.files.length) this.handleFile(this.input.files[0]); });

    this.zone.addEventListener('dragover', (e) => { e.preventDefault(); this.zone.classList.add('drag-over'); });
    this.zone.addEventListener('dragleave', () => this.zone.classList.remove('drag-over'));
    this.zone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.zone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) this.handleFile(e.dataTransfer.files[0]);
    });

    document.getElementById('removeFileBtn').addEventListener('click', (e) => { e.stopPropagation(); this.removeFile(); });
  },

  handleFile(file) {
    const ok = ['video/mp4', 'video/webm', 'video/x-matroska', 'video/avi', 'video/x-msvideo'];
    if (!ok.includes(file.type) && !file.name.match(/\.(mp4|webm|mkv|avi)$/i)) {
      Toast.error('Unsupported format. Use MP4, WebM, MKV, or AVI.');
      return;
    }
    this.selectedFile = file;
    this.zone.classList.add('has-file');
    this.preview.classList.add('visible');
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = this.fmtSize(file.size);
    document.getElementById('transcribeAction').classList.add('visible');
    VideoPlayer.loadFile(file);
    Toast.success(`Loaded ${file.name}`);
  },

  removeFile() {
    this.selectedFile = null;
    this.input.value = '';
    this.zone.classList.remove('has-file');
    this.preview.classList.remove('visible');
    document.getElementById('transcribeAction').classList.remove('visible');
    VideoPlayer.unload();
  },

  fmtSize(b) {
    if (!b) return '0 B';
    const u = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return (b / Math.pow(1024, i)).toFixed(1) + ' ' + u[i];
  },
};

// ── Video Player ───────────────────────────────────────────
const VideoPlayer = {
  section: null, video: null, overlay: null, subText: null, url: null,

  init() {
    this.section = document.getElementById('videoSection');
    this.video = document.getElementById('videoPlayer');
    this.overlay = document.getElementById('subtitleOverlay');
    this.subText = document.getElementById('subtitleText');
    this.video.addEventListener('timeupdate', () => this.updateOverlay());
  },

  loadFile(f) {
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = URL.createObjectURL(f);
    this.video.src = this.url;
    this.section.classList.add('visible');
  },

  unload() {
    if (this.url) { URL.revokeObjectURL(this.url); this.url = null; }
    this.video.src = '';
    this.section.classList.remove('visible');
    this.subText.textContent = '';
  },

  seekTo(t) { this.video.currentTime = t; this.video.play(); },

  updateOverlay() {
    const t = this.video.currentTime;
    let hit = false;
    for (const e of SubtitleEditor.entries) {
      if (t >= e.start && t <= e.end) {
        this.subText.textContent = e.text;
        this.overlay.style.display = 'block';
        hit = true;
        break;
      }
    }
    if (!hit) { this.subText.textContent = ''; this.overlay.style.display = 'none'; }
  },
};

// ── Transcription Engine ───────────────────────────────────
const Engine = {
  processing: false, cancelled: false,

  init() {
    document.getElementById('transcribeBtn').addEventListener('click', () => this.start());
    document.getElementById('cancelBtn').addEventListener('click', () => this.cancel());
  },

  async start() {
    const file = FileUploader.selectedFile;
    if (!file) { Toast.warning('Upload a video first.'); return; }
    const key = Settings.get('apiKey');
    if (!key) { Toast.warning('Set your API key first.'); Onboarding.input.focus(); return; }

    this.processing = true;
    this.cancelled = false;
    document.getElementById('transcribeAction').classList.remove('visible');
    Progress.show();
    Progress.reset();

    try {
      // 1) Load FFmpeg
      Progress.setStep('ffmpeg');
      Progress.setStatus('Loading transcription engine...');
      Progress.setPercent(5);
      const ff = await loadFFmpegLib();
      if (!ff.instance.isLoaded()) await ff.instance.load();
      if (this.cancelled) throw new Error('Cancelled');
      Progress.completeStep('ffmpeg');
      Progress.setPercent(20);

      // 2) Extract audio
      Progress.setStep('extract');
      Progress.setStatus('Extracting audio track...');
      Progress.setPercent(25);
      ff.instance.FS('writeFile', 'input.mp4', await ff.fetchFile(file));
      if (this.cancelled) throw new Error('Cancelled');
      await ff.instance.run('-i', 'input.mp4', '-ar', '16000', '-ac', '1', '-t', '300', 'output.wav');
      if (this.cancelled) throw new Error('Cancelled');
      const wav = ff.instance.FS('readFile', 'output.wav');
      try { ff.instance.FS('unlink', 'input.mp4'); ff.instance.FS('unlink', 'output.wav'); } catch {}
      Progress.completeStep('extract');
      Progress.setPercent(50);

      // 3) Transcribe
      Progress.setStep('transcribe');
      Progress.setStatus('Transcribing with Whisper AI...');
      Progress.setPercent(55);
      const model = Settings.get('model');
      let result = null;
      for (let r = 0; r <= 3; r++) {
        if (this.cancelled) throw new Error('Cancelled');
        const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'audio/wav' },
          body: wav.buffer,
        });
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const j = await resp.json();
          if (j.error?.includes('loading')) {
            const wait = j.estimated_time || 30;
            Progress.setStatus(`Model loading... retry in ${Math.ceil(wait)}s`);
            await this.sleep(wait * 1000);
            continue;
          }
          if (j.error) throw new Error(j.error);
          result = j;
          break;
        } else {
          throw new Error('Unexpected response from API');
        }
      }
      if (!result) throw new Error('Model unavailable. Try again shortly.');
      Progress.completeStep('transcribe');
      Progress.setPercent(85);

      // 4) Generate subs
      Progress.setStep('generate');
      Progress.setStatus('Generating subtitles...');
      const text = result.text || '';
      if (!text.trim()) throw new Error('No speech detected in this video.');
      const dur = VideoPlayer.video.duration || 60;
      const entries = Parser.generate(text, dur);
      Progress.completeStep('generate');
      Progress.setPercent(100);
      Progress.setStatus('Done');

      SubtitleEditor.loadEntries(entries);
      await this.sleep(600);
      Progress.hide();
      Toast.success(`${entries.length} subtitle entries created`);
      this.processing = false;

    } catch (err) {
      this.processing = false;
      Progress.hide();
      if (err.message === 'Cancelled') {
        Toast.info('Cancelled');
      } else {
        Toast.error(err.message);
        console.error(err);
      }
      document.getElementById('transcribeAction').classList.add('visible');
    }
  },

  cancel() { this.cancelled = true; this.processing = false; },
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
};

// ── Progress UI ────────────────────────────────────────────
const Progress = {
  section: null, statusEl: null, percentEl: null,
  init() {
    this.section = document.getElementById('progressSection');
    this.statusEl = document.getElementById('progressStatus');
    this.percentEl = document.getElementById('progressPercent');
  },
  show() { this.section.classList.add('visible'); },
  hide() { this.section.classList.remove('visible'); },
  reset() {
    this.statusEl.textContent = 'Preparing...';
    this.percentEl.textContent = '0%';
    document.querySelectorAll('.progress-step').forEach(s => s.classList.remove('active', 'completed'));
  },
  setStep(id) {
    document.querySelectorAll('.progress-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${id}`)?.classList.add('active');
  },
  completeStep(id) {
    const el = document.getElementById(`step-${id}`);
    if (el) { el.classList.remove('active'); el.classList.add('completed'); }
  },
  setPercent(p) { this.percentEl.textContent = `${Math.round(p)}%`; },
  setStatus(t) { this.statusEl.textContent = t; },
};

// ── Subtitle Parser ────────────────────────────────────────
const Parser = {
  generate(text, dur) {
    const sents = this.split(text);
    const entries = [];
    let t = 0;
    for (const s of sents) {
      const txt = s.trim();
      if (!txt) continue;
      const wc = txt.split(/\s+/).length;
      let d = Math.max(1.5, Math.min(wc / 2.5, 8));
      if (t + d > dur) d = Math.max(1, dur - t);
      entries.push({ id: this.id(), start: +(t.toFixed(2)), end: +((t + d).toFixed(2)), text: txt });
      t += d + 0.1;
      if (t >= dur) break;
    }
    return entries;
  },

  split(text) {
    let raw = text.replace(/([.!?])\s+/g, '$1|S|').replace(/,\s+(?=[A-Z])/g, ',|S|').split('|S|').map(s => s.trim()).filter(Boolean);
    if (raw.length <= 1 && text.length > 100) return this.byWords(text, 10);
    const out = [];
    for (const s of raw) {
      if (s.split(/\s+/).length > 15) out.push(...this.byWords(s, 10));
      else out.push(s);
    }
    return out;
  },

  byWords(t, n) {
    const w = t.split(/\s+/), c = [];
    for (let i = 0; i < w.length; i += n) c.push(w.slice(i, i + n).join(' '));
    return c;
  },

  id() { return 'sub_' + Math.random().toString(36).slice(2, 9); },
};

// ── Subtitle Editor ────────────────────────────────────────
const SubtitleEditor = {
  entries: [],
  container: null,
  emptyEl: null,
  countEl: null,

  init() {
    this.container = document.getElementById('subtitleEntries');
    this.emptyEl = document.getElementById('editorEmpty');
    this.countEl = document.getElementById('subtitleCount');

    document.getElementById('addEntryBtn').addEventListener('click', () => this.add());
    document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
    document.getElementById('autoTimingBtn').addEventListener('click', () => this.autoTime());
  },

  loadEntries(entries) {
    this.entries = entries;
    this.render();
    document.getElementById('editorSection').classList.add('visible');
    document.getElementById('exportSection').classList.add('visible');
  },

  render() {
    this.container.querySelectorAll('.subtitle-entry').forEach(e => e.remove());
    if (!this.entries.length) {
      this.emptyEl.style.display = '';
      this.countEl.textContent = '0 entries';
      document.getElementById('exportSection').classList.remove('visible');
      return;
    }
    this.emptyEl.style.display = 'none';
    this.countEl.textContent = `${this.entries.length} entries`;
    this.entries.forEach((e, i) => this.container.appendChild(this.makeEl(e, i)));
  },

  makeEl(entry, idx) {
    const div = document.createElement('div');
    div.className = 'subtitle-entry';
    div.dataset.id = entry.id;
    div.innerHTML = `
      <span class="entry-num">${idx + 1}</span>
      <input class="entry-time" type="text" value="${this.fmtTime(entry.start)}" aria-label="Start" />
      <input class="entry-time" type="text" value="${this.fmtTime(entry.end)}" aria-label="End" />
      <textarea class="entry-text" rows="1">${this.esc(entry.text)}</textarea>
      <button class="entry-delete" aria-label="Delete">
        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    div.addEventListener('click', (e) => {
      if (['INPUT', 'TEXTAREA', 'BUTTON', 'svg', 'line'].includes(e.target.tagName)) return;
      VideoPlayer.seekTo(entry.start);
      this.setActive(entry.id);
    });

    const times = div.querySelectorAll('.entry-time');
    times[0].addEventListener('change', () => { entry.start = this.parseTime(times[0].value); times[0].value = this.fmtTime(entry.start); });
    times[1].addEventListener('change', () => { entry.end = this.parseTime(times[1].value); times[1].value = this.fmtTime(entry.end); });

    const ta = div.querySelector('.entry-text');
    ta.addEventListener('input', () => {
      entry.text = ta.value;
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });

    div.querySelector('.entry-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      this.entries = this.entries.filter(x => x.id !== entry.id);
      this.render();
    });

    return div;
  },

  setActive(id) {
    this.container.querySelectorAll('.subtitle-entry').forEach(e => e.classList.toggle('active', e.dataset.id === id));
  },

  add() {
    const last = this.entries[this.entries.length - 1];
    this.entries.push({ id: Parser.id(), start: last ? last.end + 0.1 : 0, end: (last ? last.end + 0.1 : 0) + 3, text: 'New subtitle' });
    this.render();
    this.container.scrollTop = this.container.scrollHeight;
    document.getElementById('editorSection').classList.add('visible');
    document.getElementById('exportSection').classList.add('visible');
  },

  clearAll() {
    if (!this.entries.length || !confirm('Clear all entries?')) return;
    this.entries = [];
    this.render();
  },

  autoTime() {
    if (!this.entries.length) return;
    const d = VideoPlayer.video.duration || 60;
    const each = d / this.entries.length;
    this.entries.forEach((e, i) => { e.start = +(i * each).toFixed(2); e.end = +((i + 1) * each - 0.1).toFixed(2); });
    this.render();
    Toast.success('Timing redistributed');
  },

  fmtTime(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
  },

  parseTime(str) {
    const p = str.split(':');
    if (p.length === 3) { const [h, m, r] = p; const [s, ms] = r.split('.'); return +h * 3600 + +m * 60 + +s + (+ms || 0) / 1000; }
    if (p.length === 2) { const [m, r] = p; const [s, ms] = r.split('.'); return +m * 60 + +s + (+ms || 0) / 1000; }
    return parseFloat(str) || 0;
  },

  esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; },
};

// ── Export Manager ─────────────────────────────────────────
const Exporter = {
  init() {
    document.getElementById('exportSRT').addEventListener('click', () => this.srt());
    document.getElementById('exportVTT').addEventListener('click', () => this.vtt());
    document.getElementById('exportTXT').addEventListener('click', () => this.txt());
    ['exportSRT', 'exportVTT', 'exportTXT'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById(id).click(); } });
    });
  },

  name() { const f = FileUploader.selectedFile; return f ? f.name.replace(/\.[^.]+$/, '') : 'subtitles'; },

  srt() {
    const e = SubtitleEditor.entries;
    if (!e.length) { Toast.warning('No entries to export'); return; }
    let s = '';
    e.forEach((x, i) => { s += `${i+1}\n${this.t(x.start,',')} --> ${this.t(x.end,',')}\n${x.text}\n\n`; });
    this.dl(s, `${this.name()}.srt`, 'text/srt');
    Toast.success('SRT downloaded');
  },

  vtt() {
    const e = SubtitleEditor.entries;
    if (!e.length) { Toast.warning('No entries to export'); return; }
    let s = 'WEBVTT\n\n';
    e.forEach((x, i) => { s += `${i+1}\n${this.t(x.start,'.')} --> ${this.t(x.end,'.')}\n${x.text}\n\n`; });
    this.dl(s, `${this.name()}.vtt`, 'text/vtt');
    Toast.success('VTT downloaded');
  },

  txt() {
    const e = SubtitleEditor.entries;
    if (!e.length) { Toast.warning('No entries to export'); return; }
    this.dl(e.map(x => x.text).join('\n'), `${this.name()}.txt`, 'text/plain');
    Toast.success('TXT downloaded');
  },

  t(sec, sep) {
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = Math.floor(sec%60), ms = Math.round((sec%1)*1000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${sep}${String(ms).padStart(3,'0')}`;
  },

  dl(content, name, mime) {
    const b = new Blob([content], { type: mime });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(u);
  },
};

// ── App ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  Onboarding.init();
  SettingsModal.init();
  FileUploader.init();
  VideoPlayer.init();
  Engine.init();
  Progress.init();
  SubtitleEditor.init();
  Exporter.init();
});
