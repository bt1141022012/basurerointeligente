import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Wifi } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

export default function ESP32ViewerScreen({ esp32Ip, navigation }) {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const address = esp32Ip?.trim().replace(/\/+$/, '');
  const url = address
    ? `${/^https?:\/\//i.test(address) ? '' : 'http://'}${address}/`
    : '';

  const reloadPage = () => {
    setLoadError('');
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.container}>
      {url ? (
        <>
          <View style={styles.toolbar}>
            <View style={styles.addressContainer}>
              <Wifi color="#38bdf8" size={16} />
              <Text style={styles.address} numberOfLines={1}>{url}</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Recargar sitio"
              style={styles.reloadButton}
              onPress={reloadPage}
            >
              <RefreshCw color="#e2e8f0" size={18} />
            </TouchableOpacity>
          </View>
          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              source={{ uri: url }}
              style={styles.webView}
              onLoadStart={() => {
                setIsLoading(true);
                setLoadError('');
              }}
              onLoadEnd={() => setIsLoading(false)}
              onError={(event) => {
                setIsLoading(false);
                setLoadError(
                  event.nativeEvent.description || 'No se pudo cargar el sitio del ESP32.'
                );
              }}
              javaScriptEnabled
              domStorageEnabled
            />
            {isLoading && !loadError && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#38bdf8" size="large" />
                <Text style={styles.statusText}>Conectando con el ESP32...</Text>
              </View>
            )}
            {!!loadError && (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorTitle}>No se pudo abrir el sitio</Text>
                <Text style={styles.statusText}>{loadError}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.retryButton}
                  onPress={reloadPage}
                >
                  <RefreshCw color="#ffffff" size={16} />
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Wifi color="#38bdf8" size={36} />
          <Text style={styles.errorTitle}>IP del ESP32 no configurada</Text>
          <Text style={styles.statusText}>
            Configura la dirección IP para abrir el sitio web del dispositivo.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.retryButtonText}>Ir a configuración</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  toolbar: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  addressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  address: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 13,
  },
  reloadButton: {
    padding: 8,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#0f172a',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#0284c7',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
