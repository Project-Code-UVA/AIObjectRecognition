import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { analyzeImage } from '../services/imageRecognitionService';
import { saveHistoryEntry, loadHistory } from '../services/storageService';
import * as FileSystem from 'expo-file-system';
import { decode as atob, encode as btoa } from 'base-64';

const ELEVENLABS_API_KEY = '';
const ELEVENLABS_VOICE_ID = '56AoDkrOh6qfVPDXZ7Pt';

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

export default function CameraScreen({ navigate }) {
  const cameraRef = useRef(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [autoCapture, setAutoCapture] = useState(false);
  const intervalRef = useRef(null);
  
  // Load history count for badge
  useEffect(() => {
    refreshHistoryCount();
  }, []);

  const refreshHistoryCount = async () => {
    const history = await loadHistory();
    setHistoryCount(history.length);
  };

  // Request permissions on mount
  useEffect(() => {
    if (!cameraPermission) requestCameraPermission();
    if (!micPermission) requestMicPermission();
  }, []);

  // Handle auto-capture interval
  useEffect(() => {
    if (autoCapture) {
      intervalRef.current = setInterval(() => {
        handleTakePhoto(true);
      }, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoCapture]);

  // Permissions UI
  if (!cameraPermission || !micPermission) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size={50} color="#3498db" />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }
  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialIcons name="no-photography" size={80} color="#e74c3c" />
        <Text style={styles.errorText}>No access to camera or microphone</Text>
        <TouchableOpacity style={styles.controlButton} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={requestMicPermission}>
          <Text style={styles.buttonText}>Grant Microphone</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // TTS wrapper
  const speakIfEnabled = (text) => {
    if (ttsEnabled) {
      speakWithElevenLabs(text);
    }
  };

  // Take photo handler
  const handleTakePhoto = async (fromAuto = false) => {
    if (!cameraRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      let label = 'Photo';
      try {
        const analysis = await analyzeImage(photo.base64);
        label = analysis.description || 'Photo';
        if (!fromAuto) speakIfEnabled(label);
      } catch {}
      await saveHistoryEntry({
        version: 1,
        timestamp: new Date().toISOString(),
        imageUri: photo.uri,
        label,
        type: 'photo',
      });
      refreshHistoryCount();
      if (!fromAuto) Alert.alert('Photo Saved', 'Photo has been added to history.');
    } catch (e) {
      if (!fromAuto) Alert.alert('Error', 'Failed to take photo: ' + e.message);
    }
    setIsProcessing(false);
  };

  // TTS toggle handler
  const handleTtsToggle = () => setTtsEnabled((prev) => !prev);

  // Video (auto-capture) toggle handler
  const handleAutoCaptureToggle = () => setAutoCapture((prev) => !prev);

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing="back"
        enableAudio={true}
      >
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size={50} color="#3498db" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </CameraView>
      {/* History button in top right */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigate('History')}
          accessibilityLabel="View history"
        >
          <MaterialIcons name="history" size={28} color="#3498db" />
          {historyCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{historyCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      {/* Bottom controls */}
      <View style={styles.footer}>
        {/* Video (auto-capture) toggle */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            autoCapture ? styles.activeButton : null,
          ]}
          onPress={handleAutoCaptureToggle}
          disabled={isProcessing}
          accessibilityLabel={autoCapture ? "Stop Auto Photo" : "Start Auto Photo"}
        >
          <MaterialIcons name={autoCapture ? "stop" : "videocam"} size={28} color="white" />
          <Text style={styles.buttonText}>{autoCapture ? "Stop" : "Video"}</Text>
        </TouchableOpacity>
        {/* Take Photo */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleTakePhoto(false)}
          disabled={isProcessing}
          accessibilityLabel="Take Photo"
        >
          <MaterialIcons name="photo-camera" size={28} color="white" />
          <Text style={styles.buttonText}>Photo</Text>
        </TouchableOpacity>
        {/* TTS toggle */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleTtsToggle}
          accessibilityLabel="Toggle Text to Speech"
        >
          <MaterialIcons name={ttsEnabled ? "volume-up" : "volume-off"} size={28} color="white" />
          <Text style={styles.buttonText}>{ttsEnabled ? "TTS On" : "TTS Off"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  camera: { flex: 1 },
  header: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  badge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    marginLeft: 6,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 24,
  },
  controlButton: {
    backgroundColor: '#3498db',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#e67e22',
  },
  buttonText: { color: 'white', fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 20, fontWeight: 'bold', color: '#e74c3c', marginTop: 20, textAlign: 'center' },
  loadingText: { fontSize: 18, color: '#3498db', marginTop: 20 },
  processingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  processingText: { marginTop: 20, fontSize: 18, color: '#3498db' },
});
