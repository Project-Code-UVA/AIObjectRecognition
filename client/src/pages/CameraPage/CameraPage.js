import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import CameraComponent from "../../components/Camera/CameraComponent";
import { Ionicons } from "@expo/vector-icons";

export default function CameraPage() {
  const [capturedImage, setCapturedImage] = useState(null);

  const handlePictureTaken = (photo) => {
    setCapturedImage(photo.uri);
    console.log("Captured Image"); // Modify this to send picture data to backend team
  };

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <CameraComponent onPictureTaken={handlePictureTaken} />
      ) : (
        <View style={styles.fullScreenPreview}>
          <Image source={{ uri: capturedImage }} style={styles.fullImage} />
          <TouchableOpacity style={styles.closeButton} onPress={() => setCapturedImage(null)}>
            <Ionicons name="close" size={40} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },

  fullScreenPreview: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },

  fullImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 5,
  },
});
