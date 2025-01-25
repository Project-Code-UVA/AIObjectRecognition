import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function LandingPage() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Image source={require("../../../assets/images/logo.png")} style={styles.logo} /> 
      <Text style={styles.title}>Welcome to A.Eyes</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("CameraPage")}>
        <Text style={styles.buttonText}>Open Camera</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { width: 100, height: 100, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  button: { backgroundColor: "black", padding: 10, borderRadius: 5 },
  buttonText: { color: "white", fontSize: 16 },
});
