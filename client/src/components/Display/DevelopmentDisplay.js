import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import socket from '../../../socket';

export default function DevelopmentDisplay() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const handlePhotoData = (data) => {
      // Append the new photo URI to the list
      setPhotos((prevPhotos) => [...prevPhotos, data.photoURI]);
      // console.log("Photo", data);
    };

    socket.on('photoData', handlePhotoData);

    // Cleanup listener on unmount
    return () => {
      socket.off('photoData', handlePhotoData);
    };
  }, []);
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Dev Display</Text>
      {photos.map((uri, index) => (
        <Image key={index} source={{ uri }} style={styles.image} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 300,
    height: 200, 
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    zIndex: 1000,
  },
  heading: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  image: { width: '100%', height: 150, marginVertical: 5 },
});
