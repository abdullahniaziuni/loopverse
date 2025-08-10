import { useState, useRef, useCallback } from 'react';

export interface VideoRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedBlob: Blob | null;
  isProcessing: boolean;
}

export interface UseVideoRecordingReturn {
  state: VideoRecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  downloadRecording: () => void;
  clearRecording: () => void;
}

export const useVideoRecording = (): UseVideoRecordingReturn => {
  const [state, setState] = useState<VideoRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    recordedBlob: null,
    isProcessing: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      // Get screen capture with audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Try to get microphone audio as well
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
      } catch (micError) {
        console.warn('Could not access microphone:', micError);
      }

      // Combine streams if we have both
      let combinedStream = displayStream;
      if (micStream) {
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();
        
        // Add display audio
        if (displayStream.getAudioTracks().length > 0) {
          const displaySource = audioContext.createMediaStreamSource(displayStream);
          displaySource.connect(destination);
        }
        
        // Add microphone audio
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(destination);
        
        // Create new stream with video from display and combined audio
        combinedStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...destination.stream.getAudioTracks()
        ]);
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setState(prev => ({
          ...prev,
          recordedBlob: blob,
          isRecording: false,
          isPaused: false,
          isProcessing: false
        }));

        // Stop all tracks
        combinedStream.getTracks().forEach(track => track.stop());
        if (micStream) {
          micStream.getTracks().forEach(track => track.stop());
        }

        console.log('✅ Recording completed, blob size:', blob.size);
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        setState(prev => ({ ...prev, isRecording: false, isProcessing: false }));
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
        }));
      }, 1000);

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        recordedBlob: null,
        isProcessing: false
      }));

      console.log('✅ Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && state.isRecording) {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      mediaRecorderRef.current.stop();
      console.log('🛑 Recording stopped');
    }
  }, [state.isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      console.log('⏸️ Recording paused');
    }
  }, [state.isRecording, state.isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      
      // Resume duration timer
      const pausedDuration = state.duration;
      startTimeRef.current = Date.now() - (pausedDuration * 1000);
      
      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
        }));
      }, 1000);
      
      console.log('▶️ Recording resumed');
    }
  }, [state.isRecording, state.isPaused, state.duration]);

  const downloadRecording = useCallback(() => {
    if (state.recordedBlob) {
      const url = URL.createObjectURL(state.recordedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `session-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ Recording downloaded');
    }
  }, [state.recordedBlob]);

  const clearRecording = useCallback(() => {
    setState(prev => ({
      ...prev,
      recordedBlob: null,
      duration: 0
    }));
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    console.log('🗑️ Recording cleared');
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    clearRecording,
  };
};
