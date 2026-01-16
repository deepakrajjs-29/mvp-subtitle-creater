import { createFFmpeg, fetchFile } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.mjs';

const ffmpeg = createFFmpeg({ log: true });

window.processVideo = async function() {
  const input = document.getElementById("videoInput");
  const output = document.getElementById("output");
  const file = input.files[0];
  
  if (!file) {
    alert("Please select an .mp4 file");
    return;
  }
  
  try {
    output.textContent = "🔄 Loading FFmpeg...";
    
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    
    output.textContent = "🎧 Extracting audio from video...";
    
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));
    await ffmpeg.run('-i', 'input.mp4', '-ar', '16000', '-ac', '1', 'output.wav');
    const wavData = ffmpeg.FS('readFile', 'output.wav');
    
    output.textContent = "📡 Sending audio to Whisper API...";
    
    const response = await fetch("https://api-inference.huggingface.co/models/openai/whisper-base", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "Content-Type": "audio/wav"
      },
      body: wavData.buffer
    });
    
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const result = await response.json();
      
      if (result.text) {
        output.textContent = "✅ Transcript:\n\n" + result.text;
      } else {
        output.textContent = "❌ Error: " + JSON.stringify(result, null, 2);
      }
    } else {
      const text = await response.text();
      output.textContent = "❌ Unexpected response:\n\n" + text;
    }
  } catch (error) {
    output.textContent = "❌ Error: " + error.message;
    console.error(error);
  }
};
