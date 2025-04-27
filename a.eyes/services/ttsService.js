import React, { createContext, useContext, useState } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { decode as atob, encode as btoa } from 'base-64';
import Constants from 'expo-constants';

const ELEVENLABS_API_KEY = Constants.expoConfig.extra.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = '56AoDkrOh6qfVPDXZ7Pt';
const TtsContext = createContext();

export function TtsProvider({ children }) { // <-- Capitalized
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const toggleTts = () => setTtsEnabled((prev) => !prev);

  return (
    <TtsContext.Provider value={{ ttsEnabled, toggleTts }}>
      {children}
    </TtsContext.Provider>
  );
}

export function useTts() { // <-- Lowercase
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