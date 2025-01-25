import React, { useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import CameraComponent from "../../components/Camera/CameraComponent";

export default function CameraPage() {
  const [capturedImage, setCapturedImage] = useState(null);

  const handlePictureTaken = (photo) => {
    setCapturedImage(photo.uri);
    console.log("Captured Image:", photo.base64); // Modify this to send picture data to backend team
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>A.Eyes</Text>
      <CameraComponent onPictureTaken={handlePictureTaken} />
      {capturedImage && <Image source={{ uri: capturedImage }} style={styles.preview} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  preview: { width: 200, height: 200, marginTop: 10 },
});
