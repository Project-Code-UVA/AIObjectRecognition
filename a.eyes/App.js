import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import ChatScreen from './screens/ChatScreen';

export default function App() {
  const [screen, setScreen] = useState('Home');
  const [chatParams, setChatParams] = useState(null);

  const navigate = (target, params = null) => {
    console.log(`Navigating to ${target}`, params);
    
    // If going to Chat with params, update them
    if (target === 'Chat' && params) {
      setChatParams(params);
    }
    // If going to any other screen from Chat, reset params
    else if (screen === 'Chat' && target !== 'Chat') {
      setChatParams(null);
    }
    
    setScreen(target);
  };

  // Add important debugging
  useEffect(() => {
    console.log('Current screen:', screen);
    console.log('Chat params:', chatParams);
  }, [screen, chatParams]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {screen === 'Home' && <HomeScreen navigate={navigate} />}
      {screen === 'Camera' && <CameraScreen navigate={navigate} />}
      {screen === 'Chat' && <ChatScreen navigate={navigate} chatParams={chatParams} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});