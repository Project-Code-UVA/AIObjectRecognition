import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen({ navigate }) {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <MaterialIcons name="visibility" size={80} color="#3498db" />
        <Text style={styles.title}>A.Eyes</Text>
        <Text style={styles.subtitle}>Vision Assistant for the Visually Impaired</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigate('Camera')}
          accessibilityLabel="Open camera to identify objects"
          accessibilityHint="Takes a photo to identify what's in front of you"
        >
          <MaterialIcons name="camera-alt" size={36} color="white" />
          <Text style={styles.buttonText}>Open Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={() => navigate('Chat')}
          accessibilityLabel="View previous chat history"
          accessibilityHint="Shows your previous image descriptions"
        >
          <MaterialIcons name="chat" size={36} color="white" />
          <Text style={styles.buttonText}>View History</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.instructions}>
        Tap "Open Camera" to capture an image and get a description of what's in front of you.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 40,
  },
  button: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    marginVertical: 10,
  },
  secondaryButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  instructions: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
});