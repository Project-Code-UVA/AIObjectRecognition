import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import CameraComponent from "../../components/Camera/CameraComponent";
import LiveCameraComponent from "../../components/Camera/LiveCameraComponent";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import socket from "../../../socket";
import DevelopmentDisplay from "../../components/Display/DevelopmentDisplay";


export default function CameraPage() {
  const navigation = useNavigation();
  const [capturedImage, setCapturedImage] = useState(null);
  const [mode, setMode] = useState('photo'); // 'photo' or 'live'

  const handlePictureTaken = (photo) => {
    setCapturedImage(photo.uri);
    socket.emit('photoData', { photoURI: photo.uri, timestamp: Date.now() });
    console.log("Captured Image"); // Modify this to send picture data to backend team
  };

  return (
    <View style={styles.container}>

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'photo' && styles.activeMode]}
          onPress={() => setMode('photo')}
        >
          <Text style={styles.modeText}>PHOTO</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'live' && styles.activeMode]}
          onPress={() => setMode('live')}
        >
          <Text style={styles.modeText}>LIVE</Text>
        </TouchableOpacity>
      </View>

      {mode === 'photo' ? (
        <CameraComponent onPictureTaken={handlePictureTaken} />
      ) : (
        <LiveCameraComponent />
      )}

      {/* {capturedImage && (
        <View style={styles.fullScreenPreview}>
          <Image source={{ uri: capturedImage }} style={styles.fullImage} />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setCapturedImage(null)}
          >
            <Ionicons name="close" size={40} color="white" />
          </TouchableOpacity>
        </View>
      )} */}

      <DevelopmentDisplay />

      {/* <TouchableOpacity onPress={() => navigation.navigate("DevelopmentDisplay")}>
        <Text>View Captured Photos</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  fullScreenPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  fullImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 5,
  },
  modeToggle: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    zIndex: 1,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 10,
  },
  activeMode: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  modeText: {
    color: 'white',
    fontSize: 16,
  },
});