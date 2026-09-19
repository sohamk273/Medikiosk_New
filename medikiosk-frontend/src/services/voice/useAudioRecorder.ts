/**
 * Custom React Hook for browser microphone audio recording using MediaRecorder API.
 * Handles permission lifecycle, supported MIME detection, chunks assembly, and resource cleanup.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'stopping'
  | 'stopped'
  | 'error';

export function getSupportedAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return '';
  }

  const candidateTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/wav',
    'audio/mp4',
  ];

  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return '';
}

export interface UseAudioRecorderReturn {
  state: RecordingState;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const mimeTypeRef = useRef<string>('');

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetRecording = useCallback(() => {
    cleanupStream();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setState('idle');
    setDuration(0);
    setAudioBlob(null);
    setError(null);
  }, [cleanupStream]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    resetRecording();
    setError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const msg = 'Microphone recording is not supported in this browser.';
      setError(msg);
      setState('error');
      return false;
    }

    const mime = getSupportedAudioMimeType();
    mimeTypeRef.current = mime;

    try {
      setState('requesting_permission');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const options: MediaRecorderOptions = mime ? { mimeType: mime } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250); // 250ms chunks
      setState('recording');
      setDuration(0);

      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      return true;
    } catch (err: any) {
      cleanupStream();
      let errorMsg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission was denied. Please allow microphone access or choose a touch option below.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No microphone device found on this system.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      setState('error');
      return false;
    }
  }, [cleanupStream, resetRecording]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cleanupStream();
        setState('stopped');
        resolve(null);
        return;
      }

      setState('stopping');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      recorder.onstop = () => {
        const mime = mimeTypeRef.current || 'audio/webm';
        const finalBlob = new Blob(chunksRef.current, { type: mime });
        cleanupStream();
        setAudioBlob(finalBlob);
        setState('stopped');

        if (finalBlob.size === 0) {
          setError('Recorded audio was empty. Please try speaking again.');
          resolve(null);
        } else if (finalBlob.size > 10 * 1024 * 1024) {
          setError('Recorded audio exceeds 10MB limit. Please provide a shorter response.');
          resolve(null);
        } else {
          resolve(finalBlob);
        }
      };

      try {
        recorder.stop();
      } catch {
        cleanupStream();
        setState('stopped');
        resolve(null);
      }
    });
  }, [cleanupStream]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupStream();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [cleanupStream]);

  return {
    state,
    duration,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
