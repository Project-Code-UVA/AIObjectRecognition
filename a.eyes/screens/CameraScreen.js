import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons';
import { analyzeImage } from '../services/imageRecognitionService';

export default function CameraScreen({ navigate }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useTTS, setUseTTS] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
        // FIX: Use MediaType directly instead of deprecated MediaTypeOptions
        mediaTypes: ['images'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setPreviewImage(imageUri);
        processImage(imageUri);
      }
    } catch (error) {
      console.error('ImagePicker error:', error);
      Alert.alert('Camera Error', 'Failed to take picture. Please try again.');
    }
  };

  const processImage = async (imageUri) => {
    try {
      setIsProcessing(true);
      console.log('Processing image...');

      const processedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 600 } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8, base64: true }
      );

      // Only add the data URI prefix if needed by the API
      // Note: Our updated analyzeImage function now handles this prefix properly
      const formattedBase64 = processedImage.base64;
      console.log('Image processed, sending for analysis...');

      // Set a timeout in case analysis takes too long
      const analysisPromise = analyzeImage(formattedBase64);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timed out')), 20000)
      );

      // Race between actual analysis and timeout
      const analysis = await Promise.race([analysisPromise, timeoutPromise])
        .catch(error => {
          console.log('Analysis error or timeout:', error.message);
          return {
            description: "Analysis took too long. Please try again with a clearer image or check your connection.",
            objects: [],
            confidence: 0
          };
        });

      if (useTTS) {
        Speech.speak(analysis.description, {
          rate: 0.9,
          pitch: 1.0,
          onDone: () => {
            setIsProcessing(false);
            navigate('Chat', { imageUri, analysis });
          },
          onError: () => {
            setIsProcessing(false);
            Alert.alert('Error', 'Could not play audio description');
            navigate('Chat', { imageUri, analysis });
          },
        });
      } else {
        setIsProcessing(false);
        navigate('Chat', { imageUri, analysis });
      }
    } catch (error) {
      console.error('Image processing error:', error);
      setIsProcessing(false);
      
      // Still navigate to chat with error info
      const errorAnalysis = {
        description: "I couldn't process this image due to a technical issue. Please try again.",
        objects: [],
        confidence: 0
      };
      
      navigate('Chat', { imageUri, analysis: errorAnalysis });
    }
  };

  const toggleTTS = () => {
    setUseTTS(prev => !prev);
    Speech.speak(useTTS ? 'Text mode activated' : 'Voice mode activated', {
      rate: 1.0,
    });
  };

  const chooseFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.7,
        mediaTypes: ['images'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setPreviewImage(imageUri);
        processImage(imageUri);
      }
    } catch (error) {
      console.error('ImagePicker error:', error);
      Alert.alert('Gallery Error', 'Failed to select image. Please try again.');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size={50} color="#3498db" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialIcons name="no-photography" size={80} color="#e74c3c" />
        <Text style={styles.errorText}>No access to camera</Text>
        <Text style={styles.instructionText}>
          Please enable camera permissions in your device settings
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isProcessing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size={50} color="#3498db" />
          <Text style={styles.processingText}>Analyzing image...</Text>
        </View>
      ) : (
        <>
          <View style={styles.cameraContainer}>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <MaterialIcons name="camera-alt" size={100} color="#bdc3c7" />
                <Text style={styles.placeholderText}>Tap the button below to take a picture</Text>
              </View>
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={chooseFromLibrary}
              accessibilityLabel="Choose from gallery"
              accessibilityHint="Select an image from your photo library"
            >
              <MaterialIcons name="photo-library" size={36} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              accessibilityLabel="Take picture"
              accessibilityHint="Captures an image to identify objects"
            >
              <MaterialIcons name="camera" size={50} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modeButton, useTTS ? styles.voiceMode : styles.textMode]}
              onPress={toggleTTS}
              accessibilityLabel={useTTS ? 'Voice mode active' : 'Text mode active'}
              accessibilityHint="Toggle between voice and text modes"
            >
              <MaterialIcons
                name={useTTS ? 'record-voice-over' : 'chat'}
                size={36}
                color="white"
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modeIndicator}>
            <Text style={styles.modeText}>
              {useTTS ? 'Voice Mode: ON' : 'Text Mode: ON'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigate('Chat')}
            accessibilityLabel="View history"
            accessibilityHint="Go to chat history page"
          >
            <MaterialIcons name="history" size={36} color="white" />
            <Text style={styles.buttonText}>History</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#f9f9f9' 
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden'
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain'
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  placeholderText: {
    color: '#ecf0f1',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 30
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#3498db',
    marginTop: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 10,
    textAlign: 'center',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#3498db',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  galleryButton: {
    backgroundColor: '#3498db',
    borderRadius: 50,
    padding: 15,
  },
  captureButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 50,
    padding: 20,
    borderWidth: 5,
    borderColor: 'white',
  },
  modeButton: { borderRadius: 50, padding: 15 },
  voiceMode: { backgroundColor: '#9b59b6' },
  textMode: { backgroundColor: '#2ecc71' },
  modeIndicator: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 15,
  },
  modeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    padding: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
