import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  Alert
} from 'react-native';
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_STORAGE_KEY = 'a.eyes.chat_history';

// Update props to receive navigate and chatParams directly
export default function ChatScreen({ navigate, chatParams }) {
  const [chats, setChats] = useState([]);
  
  // Update to use chatParams instead of route.params
  const newAnalysis = chatParams?.analysis;
  const newImageUri = chatParams?.imageUri;

  useEffect(() => {
    loadChats();
  }, []);

  // Add new analysis if provided via chatParams
  useEffect(() => {
    if (newAnalysis && newImageUri) {
      const newChat = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        imageUri: newImageUri,
        description: newAnalysis.description,
        objects: newAnalysis.objects || [],
      };
      
      setChats(prevChats => [newChat, ...prevChats]);
      storeChat(newChat);
    }
  }, [newAnalysis, newImageUri]);

  const loadChats = async () => {
    try {
      const storedChats = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (storedChats) {
        setChats(JSON.parse(storedChats));
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      Alert.alert('Error', 'Failed to load chat history');
    }
  };

  const storeChat = async (newChat) => {
    try {
      const existingChats = [...chats];
      const updatedChats = [newChat, ...existingChats];
      
      // Limit chat history to the 20 most recent items
      const limitedChats = updatedChats.slice(0, 20);
      
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(limitedChats));
    } catch (error) {
      console.error('Error storing chat:', error);
      Alert.alert('Error', 'Failed to save chat to history');
    }
  };

  const speakDescription = (text) => {
    Speech.speak(text, {
      rate: 0.9,
      pitch: 1.0,
    });
  };

  // Update to handle and display errors better
  const renderChatItem = ({ item }) => (
    <View style={styles.chatItem}>
      <Image 
        source={{ uri: item.imageUri }} 
        style={styles.chatImage} 
        defaultSource={require('../assets/placeholder.png')} // Add a placeholder image
      />
      <View style={styles.chatContent}>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
        <Text style={styles.description}>{item.description}</Text>
        
        {item.objects && item.objects.length > 0 ? (
          <View style={styles.objectList}>
            <Text style={styles.objectsTitle}>Detected Objects:</Text>
            {item.objects.map((obj, index) => (
              <Text key={index} style={styles.objectItem}>
                • {obj.label} ({Math.round(obj.confidence * 100)}%)
              </Text>
            ))}
          </View>
        ) : (
          item.description.includes("technical issue") || 
          item.description.includes("couldn't analyze") ? (
            <Text style={styles.errorText}>
              There was an error analyzing this image.
            </Text>
          ) : (
            <Text style={styles.noObjectsText}>
              No specific objects detected.
            </Text>
          )
        )}
        
        {/* Buttons for actions like sharing or re-analyzing */}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.cameraButton}
        onPress={() => navigate('Camera')}
        accessibilityLabel="Take new picture"
        accessibilityHint="Returns to camera screen to take a new picture"
      >
        <MaterialIcons name="camera-alt" size={28} color="white" />
        <Text style={styles.buttonText}>Take New Picture</Text>
      </TouchableOpacity>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="image-not-supported" size={80} color="#bdc3c7" />
          <Text style={styles.emptyText}>No image descriptions yet.</Text>
          <Text style={styles.emptySubtext}>Take a picture to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  cameraButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 10,
  },
  listContent: {
    padding: 10,
  },
  chatItem: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timestamp: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#ecf0f1',
  },
  descriptionContainer: {
    marginBottom: 15,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#34495e',
  },
  objectsContainer: {
    marginTop: 10,
  },
  objectsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  objectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  objectTag: {
    backgroundColor: '#e8f4fd',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 5,
  },
  objectText: {
    color: '#3498db',
    fontSize: 14,
  },
  chatImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#ecf0f1',
  },
  chatContent: {
    marginBottom: 15,
  },
  objectList: {
    marginTop: 10,
  },
  objectItem: {
    fontSize: 14,
    color: '#34495e',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
  },
  noObjectsText: {
    fontSize: 14,
    color: '#95a5a6',
  },
});