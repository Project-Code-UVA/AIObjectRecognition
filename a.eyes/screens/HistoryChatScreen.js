import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function HistoryChatScreen({ route, navigate }) {
  const { historyItem } = route.params;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigate('History')}>
        <MaterialIcons name="arrow-back" size={24} color="#3498db" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Image source={{ uri: historyItem.imageUri }} style={styles.image} resizeMode="contain" />
      <Text style={styles.label}>{historyItem.label}</Text>
      <Text style={styles.stub}>Chat about this image (coming soon!)</Text>
      {/* Future: Render chat messages and input here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingTop: 40 },
  image: { width: '90%', height: 250, borderRadius: 12, marginVertical: 20 },
  label: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
  stub: { fontSize: 16, color: '#aaa', marginTop: 30 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginLeft: 10, marginBottom: 10 },
  backText: { color: '#3498db', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
});