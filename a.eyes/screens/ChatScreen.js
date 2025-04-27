import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatWithImage } from '../services/chatService';
import { speakWithElevenLabs, useTts, recordAudioAsync, stopAndGetUri, elevenLabsTranscribe } from '../services/ttsService';

const CHAT_HISTORY_KEY = 'a.eyes.image_chats';

export default function ChatScreen({ navigate, route }) {
  const context = route?.params?.context;
  if (!context) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No image context provided for chat.</Text>
        <TouchableOpacity onPress={() => navigate('History')}>
          <MaterialIcons name="arrow-back" size={24} color="#3498db" />
          <Text style={{ color: '#3498db', marginTop: 8 }}>Back to History</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [chatLog, setChatLog] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [listening, setListening] = useState(false);
  const flatListRef = useRef();
  const { ttsEnabled, toggleTts } = useTts();

  useEffect(() => {
    loadChat();
  }, []);

  const loadChat = async () => {
    const raw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (raw) {
      const allChats = JSON.parse(raw);
      const found = allChats.find(c => c.id === context.id);
      setChatLog(found?.chat || []);
    }
  };

  const saveChat = async (newLog) => {
    let allChats = [];
    const raw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (raw) allChats = JSON.parse(raw);
    let idx = allChats.findIndex(c => c.id === context.id);
    if (idx === -1) {
      allChats.unshift({
        ...context,
        chat: newLog,
      });
    } else {
      allChats[idx].chat = newLog;
    }
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(allChats.slice(0, 50)));
  };

  // --- ElevenLabs STT mic logic ---
  const startListening = async () => {
    setListening(true);
    try {
      const rec = await recordAudioAsync();
      setRecording(rec);
    } catch (e) {
      setListening(false);
    }
  };

  const stopListening = async () => {
    setListening(false);
    if (!recording) return;
    try {
      const uri = await stopAndGetUri(recording);
      setRecording(null);
      // Transcribe with ElevenLabs
      setInput('Transcribing...');
      const transcript = await elevenLabsTranscribe({ fileUri: uri, mimeType: 'audio/webm' });
      setInput(transcript);
    } catch (e) {
      setInput('');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input.trim(), timestamp: new Date().toISOString() };
    const newLog = [...chatLog, userMsg];
    setChatLog(newLog);
    setInput('');
    setLoading(true);
    saveChat(newLog);

    // Show spinner in AI bubble
    const spinnerMsg = { sender: 'ai', text: '', timestamp: new Date().toISOString(), loading: true };
    setChatLog([...newLog, spinnerMsg]);

    try {
      const aiReply = await chatWithImage(context, userMsg.text);
      const aiMsg = { sender: 'ai', text: aiReply, timestamp: new Date().toISOString() };
      const updatedLog = [...newLog, aiMsg];
      setChatLog(updatedLog);
      saveChat(updatedLog);
      if (ttsEnabled) await speakWithElevenLabs(aiReply);
    } catch (e) {
      const errMsg = { sender: 'ai', text: "Sorry, I couldn't reply due to a network error.", timestamp: new Date().toISOString() };
      const updatedLog = [...newLog, errMsg];
      setChatLog(updatedLog);
      saveChat(updatedLog);
    }
    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('History')}>
          <MaterialIcons name="arrow-back" size={24} color="#3498db" />
        </TouchableOpacity>
        <Image source={{ uri: context.uri }} style={styles.thumb} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.label}>{context.objectLabel}</Text>
          <Text style={styles.desc} numberOfLines={2}>{context.gemmaDescription}</Text>
        </View>
      </View>
      <FlatList
        ref={flatListRef}
        data={chatLog}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={[styles.msg, item.sender === 'user' ? styles.userMsg : styles.aiMsg]}>
            {item.loading ? (
              <ActivityIndicator color="#3498db" />
            ) : (
              <Text style={styles.msgText}>{item.text}</Text>
            )}
            <Text style={styles.msgTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputRow}>
        <TouchableOpacity onPress={listening ? stopListening : startListening} style={styles.micBtn}>
          <MaterialIcons name={listening ? "mic-off" : "mic"} size={24} color={listening ? "#e74c3c" : "#3498db"} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about this image..."
          editable={!loading}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity onPress={handleSend} disabled={loading || !input.trim()} style={styles.sendBtn}>
          {loading ? <ActivityIndicator color="#fff" /> : <MaterialIcons name="send" size={24} color="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleTts} style={{ marginLeft: 8 }}>
          <MaterialIcons name={ttsEnabled ? "volume-up" : "volume-off"} size={24} color="#3498db" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderColor: '#eee' },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#eee' },
  label: { fontWeight: 'bold', fontSize: 16, color: '#3498db' },
  desc: { fontSize: 13, color: '#7f8c8d', marginTop: 2 },
  msg: { marginVertical: 6, padding: 10, borderRadius: 10, maxWidth: '80%' },
  userMsg: { alignSelf: 'flex-end', backgroundColor: '#3498db' },
  aiMsg: { alignSelf: 'flex-start', backgroundColor: '#e8f4fd' },
  msgText: { color: '#222', fontSize: 16 },
  msgTime: { fontSize: 10, color: '#888', marginTop: 2, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  input: { flex: 1, backgroundColor: '#f2f2f2', borderRadius: 20, paddingHorizontal: 16, fontSize: 16, marginRight: 8 },
  sendBtn: { backgroundColor: '#3498db', borderRadius: 20, padding: 10 },
  micBtn: { marginRight: 8 },
});