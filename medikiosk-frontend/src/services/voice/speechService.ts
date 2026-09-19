/**
 * Speech recognition and audio transcription client service.
 * Connects frontend microphone recordings to backend POST /api/v1/speech/transcribe.
 */
import { API_BASE_URL } from '@/services/api/client';

export interface SpeechTranscriptionResponse {
  success: boolean;
  transcript: string;
  language: string;
  detected_language?: string | null;
  confidence?: number | null;
  is_empty: boolean;
  provider: string;
}

export async function transcribeAudio(
  audioBlob: Blob,
  languageCode: string = 'en',
  customFileName?: string
): Promise<SpeechTranscriptionResponse> {
  const formData = new FormData();

  // Determine file name and extension from MIME type
  let fileName = customFileName;
  if (!fileName) {
    const mime = (audioBlob.type || '').toLowerCase();
    if (mime.includes('webm')) {
      fileName = 'voice_recording.webm';
    } else if (mime.includes('wav')) {
      fileName = 'voice_recording.wav';
    } else if (mime.includes('ogg')) {
      fileName = 'voice_recording.ogg';
    } else if (mime.includes('mp4') || mime.includes('m4a')) {
      fileName = 'voice_recording.m4a';
    } else {
      fileName = 'voice_recording.webm';
    }
  }

  formData.append('file', audioBlob, fileName);
  formData.append('language_code', languageCode);

  const url = `${API_BASE_URL}/speech/transcribe`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Speech transcription failed with HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Ignore JSON parse failure
    }
    throw new Error(errorDetail);
  }

  return (await response.json()) as SpeechTranscriptionResponse;
}
