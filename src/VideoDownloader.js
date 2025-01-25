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
import { Feather } from '@expo/vector-icons';
import { API_URL } from '@env'; // Asegúrate de que esta variable esté configurada en tu entorno

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  iconButton: {
    padding: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VideoDownloader;