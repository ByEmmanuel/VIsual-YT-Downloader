import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Progress from 'react-native-progress';
import { Feather } from '@expo/vector-icons';
import { API_URL } from '@env';

// Función auxiliar para convertir blob a base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const VideoDownloader = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const cleanLabel = () => {
    setUrl('');
  }

  // Función para pegar el enlace del video
  const pasteFromClipboard = async () => {
    try {
        const text = await Clipboard.getStringAsync();
        setUrl(text);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener el texto del portapapeles');
    }
  };

  const downloadVideo = async () => {
    if (!url) {
      Alert.alert('Error', 'Por favor ingresa una URL');
      return;
    }

    try {
      setLoading(true);
      setDownloadProgress(0);

      // Solicitar permisos para guardar en la galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos para guardar el video');
        return;
      }

      // Hacer la solicitud al servidor para descargar el video
      const response = await fetch(`${API_URL}/Download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Error en la descarga');
      }

      // Obtener el tamaño del archivo
      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);
      let loaded = 0;

      // Recibir el blob del video
      const blob = await response.blob();

      // Crear archivo temporal
      const fileName = `video-${Date.now()}.mp4`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      // Escribir el blob en archivo temporal
      await FileSystem.writeAsStringAsync(
        fileUri,
        await blobToBase64(blob),
        { encoding: FileSystem.EncodingType.Base64 }
      );

      // Guardar en la galería
      const asset = await MediaLibrary.createAssetAsync(fileUri);

      // Crear/usar álbum dedicado
      const album = await MediaLibrary.getAlbumAsync('Descargas');
      if (album === null) {
        await MediaLibrary.createAlbumAsync('Descargas', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      // Limpiar archivo temporal
      await FileSystem.deleteAsync(fileUri);

      Alert.alert('Éxito', 'Video descargado con éxito');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al descargar el video');
    } finally {
      setLoading(false);
      setDownloadProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="Ingresa la URL del video"
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={pasteFromClipboard} style={styles.iconButton}>
          <Feather name="clipboard" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={downloadVideo}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Descargar Video</Text>
        )}
      </TouchableOpacity>

      {loading && (
        <View style={styles.progressContainer}>
          <Progress.Bar 
            progress={downloadProgress} 
            width={null} 
            height={20}
            color="#2196F3"
            borderRadius={8}
          />
          <Text style={styles.progressText}>
            {Math.round(downloadProgress * 100)}%
          </Text>
        </View>
      )};

      <View style={styles.cleanButtonContainer}>
        <TouchableOpacity onPress={cleanLabel} style={styles.cleanButton}>
          <Text style={styles.cleanButtonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  iconButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressContainer: {
    marginVertical: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  cleanButtonContainer: {
    marginTop: 10,
  },
  cleanButton: {
    backgroundColor: '#FF4081',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF4081',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  cleanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default VideoDownloader;