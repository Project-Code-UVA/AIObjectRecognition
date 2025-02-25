import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { RTCView, mediaDevices } from 'react-native-webrtc-web-shim';
import socket from '../../../socket';

export default function OneWayLiveCameraComponent() {
  const [localStream, setLocalStream] = useState(null);
  const [chunkCount, setChunkCount] = useState(0);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    const startLiveStream = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({ video: true, audio: false });
        setLocalStream(stream);
        console.log('Local stream captured:', stream);
        stream.getTracks().forEach((track) => console.log('Track info:', track));

        let options = { mimeType: 'video/webm; codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm; codecs=vp8' };
        }
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            console.log('Live data chunk available:', event.data);
            socket.emit('liveData', event.data);
          }
        };

        mediaRecorder.start(2000); // 2 second chunks
        console.log('Media recorder started:', mediaRecorder);
      } catch (error) {
        console.error('Failed to start live stream:', error);
      }
    };

    startLiveStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Camera</Text>
      {localStream && (
        <RTCView stream={localStream} style={styles.video} />
      )}
      {/* <Text style={styles.info}>Recorded chunks: {chunkCount}</Text> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    transform: [{ scaleX: -1 }],
  },
  title: {
    position: 'absolute',
    top: 20,
    color: 'white',
    fontSize: 20,
  },
  info: {
    position: 'absolute',
    bottom: 20,
    color: 'white',
    fontSize: 16,
  },
});
