import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_STORAGE_KEY = 'a.eyes.chat_history';
const HISTORY_KEY = 'a.eyes.history.v1';

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

export async function saveHistoryEntry(entry) {
  let history = await loadHistory();
  history.unshift(entry);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

export async function loadHistory() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    // Migration example: if entry.version missing, add it
    return parsed.map(e => e.version ? e : { ...e, version: 1 });
  } catch {
    return [];
  }
}

export async function clearHistory() {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export async function deleteHistoryEntry(timestamp) {
  let history = await loadHistory();
  history = history.filter(e => e.timestamp !== timestamp);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}