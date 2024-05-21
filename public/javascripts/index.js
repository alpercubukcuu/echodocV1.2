// required dom elements
const buttonEl = document.getElementById("button");
const messageEl = document.getElementById("message");
const titleEl = document.getElementById("real-time-title");

// set initial state of application variables
messageEl.style.display = "none";
let isRecording = false;
let rt;
let microphone;
let texts = {};
let lastTimestamp = 0;
const timeThreshold = 2000;

function createMicrophone() {
  let stream;
  let audioContext;
  let audioWorkletNode;
  let source;
  let audioBufferQueue = new Int16Array(0);
  return {
    async requestPermission() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    },
    async startRecording(onAudioCallback) {
      if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new AudioContext({
        sampleRate: 16_000,
        latencyHint: 'balanced',
        endUtteranceSilenceThreshold : 500,
        disablePartialTranscripts: true,
        speaker_labels: true
      });
      source = audioContext.createMediaStreamSource(stream);

      await audioContext.audioWorklet.addModule('/javascripts/audio-processor.js');
      audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');

      source.connect(audioWorkletNode);
      audioWorkletNode.connect(audioContext.destination);
      audioWorkletNode.port.onmessage = (event) => {
        const currentBuffer = new Int16Array(event.data.audio_data);
        audioBufferQueue = mergeBuffers(
          audioBufferQueue,
          currentBuffer
        );

        const bufferDuration =
          (audioBufferQueue.length / audioContext.sampleRate) * 1000;

        // wait until we have 100ms of audio data
        if (bufferDuration >= 100) {
          const totalSamples = Math.floor(audioContext.sampleRate * 0.1);

          const finalBuffer = new Uint8Array(
            audioBufferQueue.subarray(0, totalSamples).buffer
          );

          audioBufferQueue = audioBufferQueue.subarray(totalSamples)
          if (onAudioCallback) onAudioCallback(finalBuffer);
        }
      }
    },
    stopRecording() {
      stream?.getTracks().forEach((track) => track.stop());
      audioContext?.close();
      audioBufferQueue = new Int16Array(0);
    }
  }
}
function mergeBuffers(lhs, rhs) {
  const mergedBuffer = new Int16Array(lhs.length + rhs.length)
  mergedBuffer.set(lhs, 0)
  mergedBuffer.set(rhs, lhs.length)
  return mergedBuffer
}

// runs real-time transcription and handles global variables
const run = async () => {
  
  if (isRecording) {
    if (rt) {
      await rt.close(false);
      rt = null;
    }

    if (microphone) {
      microphone.stopRecording();      
      microphone = null;     
    }
    sendTranscriptToServer(texts);
    console.log(texts);
    texts = {};

  } else {
    microphone = createMicrophone();
    await microphone.requestPermission();

    const response = await fetch("/api/assembly/token"); 
    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    rt = new assemblyai.RealtimeService({ token: data.token });   
    
    rt.on("transcript", (message) => {
      let msg = "";
      texts[message.audio_start] = message.text;
      const keys = Object.keys(texts);
      keys.sort((a, b) => a - b);
      for (const key of keys) {
          if (texts[key]) {             
              msg += `🕒${key}\n 📣${texts[key]}\n\n`;
          }
      }
      messageEl.innerText = msg;      
  });

    rt.on("error", async (error) => {
      console.error('Error:', error);
      console.error('Error Message:', error.message);
      await rt.close();
    });

    rt.on("close", (event) => {
      console.log(event);
      rt = null;
    });

    await rt.connect();
    // once socket is open, begin recording
    messageEl.style.display = "";

    await microphone.startRecording((audioData) => {
      rt.sendAudio(audioData);
    });
  }

  isRecording = !isRecording;
  buttonEl.innerText = isRecording ? "Stop" : "Record";
  titleEl.innerText = isRecording
    ? "Click stop to end recording!"
    : "Click start to begin recording!";
};

async function sendTranscriptToServer(transcript) {
  try {
      const response = await fetch('/api/summary/get-summary', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transcript }), 
      });      
      if (response.ok) {
        console.log('Transcript saved successfully');
        const data = await response.json();         
        messageEl.innerText = data.result;
        
      } else {
          console.error('Failed to save transcript');
      }
  } catch (error) {
      console.error('Error sending transcript to server:', error);
  }
}

buttonEl.addEventListener("click", () => run());