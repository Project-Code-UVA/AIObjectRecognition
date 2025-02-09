import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { RTCView, mediaDevices, RTCPeerConnection } from 'react-native-webrtc-web-shim';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Replace with your server URL

export default function LiveCameraComponent() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    const startLiveStream = async () => {
      try {
        // Get local media stream
        const stream = await mediaDevices.getUserMedia({ video: true, audio: false });
        setLocalStream(stream);

        // Create a new RTCPeerConnection
        peerConnection.current = new RTCPeerConnection();

        // Add local stream tracks to the peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.current.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('signal', { type: 'candidate', candidate: event.candidate });
          }
        };

        // Handle signaling messages
        socket.on('signal', async (data) => {
          if (data.type === 'offer') {
            // Set remote description
            await peerConnection.current.setRemoteDescription(data.offer);

            // Create and send an answer
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socket.emit('signal', { type: 'answer', answer });
          } else if (data.type === 'answer') {
            // Set remote description
            await peerConnection.current.setRemoteDescription(data.answer);
          } else if (data.type === 'candidate') {
            // Add ICE candidate
            await peerConnection.current.addIceCandidate(data.candidate);
          }
        });

        // Send an offer to the other peer
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit('signal', { type: 'offer', offer });
      } catch (error) {
        console.error('Failed to start live stream:', error);
      }
    };

    startLiveStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      socket.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Local stream */}
      {localStream && (
        <RTCView stream={localStream} style={styles.video} />
      )}

      {/* Remote stream */}
      {remoteStream && (
        <RTCView stream={remoteStream} style={styles.video} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});