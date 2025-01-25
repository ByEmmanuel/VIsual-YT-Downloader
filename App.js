import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import VideoDownloader from "./src/VideoDownloader";

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Pega aqui tu enlace para descargar el video</Text>
        <View style={styles.input}>
          <VideoDownloader />
        </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
    
    
  },
  input: {
    position: 'relative',
    top: -10,
    width: '100%',
    maxWidth: 400,
    marginTop: 20,
  },
});
