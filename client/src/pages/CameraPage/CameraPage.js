import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import CameraComponent from "../../components/Camera/CameraComponent";
import LiveCameraComponent from "../../components/Camera/LiveCameraComponent";
import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from 'expo-camera';
import DevelopmentDisplay from "../../components/Display/DevelopmentDisplay";

export default function CameraPage() {
  const [mode, setMode] = useState('photo'); // 'photo' or 'live'
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
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
        <CameraComponent 
          permission={permission} 
          requestPermission={requestPermission} 
          facing={facing}
          toggleCameraFacing={toggleCameraFacing}
        />
      ) : (
        <LiveCameraComponent />
      )}

      <DevelopmentDisplay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
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
