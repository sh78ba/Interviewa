import { useState, useRef, useCallback } from "react";

export function useAudioRecorder(
  onRecordingComplete: (blob: Blob) => void,
  onSilenceDetected?: () => void,
  onSilenceBroken?: () => void,
  autoStopMs: number = 3000
) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      // VAD setup
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      microphone.connect(analyser);

      let lastSpeechTime = Date.now();
      let hasSpoken = false;
      let silenceFired = false;

      const checkInterval = setInterval(() => {
        if (mr.state !== "recording") {
          clearInterval(checkInterval);
          return;
        }
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        
        let maxVolume = 0;
        for (let i = 4; i < array.length; i++) {
          if (array[i] > maxVolume) {
            maxVolume = array[i];
          }
        }

        if (maxVolume > 40) { 
          lastSpeechTime = Date.now();
          hasSpoken = true;
          if (silenceFired) {
            silenceFired = false;
            onSilenceBroken?.();
          }
        } else {
          if (hasSpoken && Date.now() - lastSpeechTime > autoStopMs) {
            if (!silenceFired) {
              silenceFired = true;
              onSilenceDetected?.();
            }
          } else if (!hasSpoken && Date.now() - lastSpeechTime > 15000) {
            // Give up if no speech for 15 seconds
            clearInterval(checkInterval);
            mr.stop();
          }
        }
      }, 100);

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        clearInterval(checkInterval);
        stream.getTracks().forEach((t) => t.stop());
        analyser.disconnect();
        microphone.disconnect();
        if (audioContextRef.current) {
          void audioContextRef.current.close();
        }
        setIsRecording(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(blob);
      };

      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error("Microphone access denied", err);
      setIsRecording(false);
      return false;
    }
  }, [onRecordingComplete, autoStopMs, onSilenceDetected, onSilenceBroken]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const forceStop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    forceStop
  };
}
