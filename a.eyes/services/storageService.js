import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_STORAGE_KEY = 'a.eyes.chat_history';

export const getStoredChats = async () => {
  try {
    const storedChats = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
    return storedChats ? JSON.parse(storedChats) : [];
  } catch (error) {
    console.error('Error getting stored chats:', error);
    return [];
  }
};

export const storeChat = async (chatItem) => {
  try {
    const existingChats = await getStoredChats();
    const updatedChats = [chatItem, ...existingChats];
    
    // Limit chat history to the 20 most recent items
    const limitedChats = updatedChats.slice(0, 20);
    
    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(limitedChats));
  } catch (error) {
    console.error('Error storing chat:', error);
  }
};