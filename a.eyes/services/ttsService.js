import React, { createContext, useContext, useState } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const ELEVENLABS_API_KEY = Constants.expoConfig.extra.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = '56AoDkrOh6qfVPDXZ7Pt';
const ELEVENLABS_STT_ENDPOINT = 'https://api.elevenlabs.io/v1/speech-to-text';
const TtsContext = createContext();

export function TtsProvider({ children }) {
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const toggleTts = () => setTtsEnabled((prev) => !prev);

  return (
    <TtsContext.Provider value={{ ttsEnabled, toggleTts }}>
      {children}
    </TtsContext.Provider>
  );
}

export function useTts() {
  return useContext(TtsContext);
}

export async function speakWithElevenLabs(text) {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          }
        }),
      }
    );

    if (!response.ok) {
      console.error('Error from ElevenLabs:', await response.text());
      return;
    }

    // Convert arrayBuffer to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = arrayBufferToBase64(arrayBuffer);
    const fileUri = FileSystem.cacheDirectory + `tts-${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(fileUri, base64Audio, { encoding: FileSystem.EncodingType.Base64 });

    const soundObject = new Audio.Sound();
    await soundObject.loadAsync({ uri: fileUri });
    await soundObject.playAsync();

  } catch (error) {
    console.error('Error:', error);
  }
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- ElevenLabs Speech-to-Text ---

export async function elevenLabsTranscribe({ fileUri, mimeType = 'audio/webm' }) {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: 'audio.webm', // or 'audio.m4a' if that's your format
      type: mimeType,
    });
    formData.append('model_id', 'scribe_v1');

    const response = await fetch(ELEVENLABS_STT_ENDPOINT, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        // Do NOT set 'Content-Type' here
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error('ElevenLabs STT error: ' + err);
    }

    const data = await response.json();
    return data.text || data.transcript || '';
  } catch (error) {
    console.error('ElevenLabs STT error:', error);
    throw error;
  }
}

// --- Audio Recording Helper ---

export async function recordAudioAsync() {
  try {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
    await recording.startAsync();
    return recording;
  } catch (error) {
    console.error('Failed to start recording', error);
    throw error;
  }
}

export async function stopAndGetUri(recording) {
  try {
    await recording.stopAndUnloadAsync();
    return recording.getURI();
  } catch (error) {
    console.error('Failed to stop recording', error);
    throw error;
  }
}