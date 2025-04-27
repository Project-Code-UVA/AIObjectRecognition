import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import ChatScreen from './screens/HistoryScreens';
import HistoryScreen from './screens/HistoryScreens';
import HistoryChatScreen from './screens/HistoryChatScreen';

export default function App() {
  const [screen, setScreen] = useState('Home');
  const [chatParams, setChatParams] = useState(null);

  const navigate = (target, params = null) => {
    console.log(`Navigating to ${target}`, params);

    if (target === 'Chat' && params) {
      setChatParams(params);
    } else if (target === 'HistoryChat' && params) {
      setChatParams(params);
    } else if ((screen === 'Chat' || screen === 'HistoryChat') && target !== 'Chat' && target !== 'HistoryChat') {
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
      {screen === 'History' && <HistoryScreen navigate={navigate} />}
      {screen === 'HistoryChat' && <HistoryChatScreen navigate={navigate} route={{ params: chatParams }} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});