import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, Modal, Dimensions } from 'react-native';
import { loadHistory, clearHistory, deleteHistoryEntry } from '../services/storageService';
import { MaterialIcons } from '@expo/vector-icons';

export default function HistoryScreen({ navigate }) {
  const [history, setHistory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => setHistory(await loadHistory());

  const handleClear = async () => {
    Alert.alert('Clear All?', 'Delete all history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await clearHistory(); refresh(); } }
    ]);
  };

  const handleDelete = async (timestamp) => {
    await deleteHistoryEntry(timestamp);
    refresh();
  };

  const handleImagePress = (uri) => {
    setModalImage(uri);
    setModalVisible(true);
  };

  const handleChatPress = (item) => {
    navigate('HistoryChat', { historyItem: item });
  };

  return (
    <View style={styles.container}>
      {/* Fullscreen Image Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
            <MaterialIcons name="close" size={36} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: modalImage }} style={styles.fullImage} resizeMode="contain" />
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity onPress={handleClear}>
          <MaterialIcons name="delete-forever" size={28} color="#e74c3c" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={history}
        keyExtractor={item => item.timestamp}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TouchableOpacity onPress={() => handleImagePress(item.imageUri)}>
              <Image source={{ uri: item.imageUri }} style={styles.thumb} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.time}>{new Date(item.timestamp).toLocaleString()}</Text>
              <TouchableOpacity style={styles.chatButton} onPress={() => handleChatPress(item)}>
                <MaterialIcons name="chat" size={20} color="#3498db" />
                <Text style={styles.chatText}>Chat</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.timestamp)}>
              <MaterialIcons name="delete" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No history yet.</Text>}
      />
      <TouchableOpacity style={styles.backButton} onPress={() => navigate('Home')}>
        <MaterialIcons name="arrow-back" size={24} color="white" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#3498db' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, marginBottom: 10, padding: 10, elevation: 2 },
  thumb: { width: 60, height: 60, borderRadius: 8, marginRight: 10, backgroundColor: '#eee' },
  label: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  time: { fontSize: 12, color: '#7f8c8d' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  backButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3498db', borderRadius: 20, padding: 10, alignSelf: 'center', marginTop: 10 },
  backText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  chatButton: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  chatText: { color: '#3498db', marginLeft: 4, fontWeight: 'bold' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: width * 0.95, height: height * 0.7, borderRadius: 12 },
  modalClose: { position: 'absolute', top: 40, right: 20, zIndex: 2 },
});