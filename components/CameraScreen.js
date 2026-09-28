import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';

import {
  Camera as CameraIcon,
  Power,
  Terminal,
  Send,
} from 'lucide-react-native';

import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import LogsModal from '../components/LogsModal';

export default function CameraScreen({
  esp32Status,
  isProcessing,
  detectedClass,
  confidence,
  logs,
  onClearLogs,
  onCaptureAndSend,
  onSendToESP32,
}) {
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [showLogsModal, setShowLogsModal] = useState(false);

  // Referencia de la cámara
  const cameraRef = useRef(null);

  // Permisos de cámara
  const [permission, requestPermission] = useCameraPermissions();

  // Solicitar permiso al abrir la pantalla
  useEffect(() => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  /**
   * Captura una fotografía.
   *
   * Si tu componente padre necesita recibir la imagen,
   * se intenta llamar onCaptureAndSend(photo).
   */
  const handleCapture = async () => {
    if (!cameraRef.current) {
      console.log('La cámara todavía no está disponible');
      return;
    }

    if (!permission?.granted) {
      console.log('No hay permisos para usar la cámara');
      await requestPermission();
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      console.log('Foto capturada correctamente');

      /*
       * Aquí enviamos la foto al componente padre.
       *
       * photo contiene información como:
       * {
       *   uri,
       *   width,
       *   height,
       *   base64
       * }
       */
      if (onCaptureAndSend) {
        await onCaptureAndSend(photo);
      }
    } catch (error) {
      console.error('Error capturando la imagen:', error);
    }
  };

  /**
   * Encender / apagar cámara.
   */
  const toggleCamera = () => {
    setIsCameraActive((current) => !current);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* =========================
            ESTADO ESP32
        ========================== */}
        <View style={styles.statusBar}>
          <Text style={styles.statusLabel}>
            Estado del ESP32:
          </Text>

          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                esp32Status === 'Online'
                  ? styles.dotOnline
                  : esp32Status === 'Offline'
                  ? styles.dotOffline
                  : styles.dotUnknown,
              ]}
            />

            <Text style={styles.statusText}>
              {esp32Status}
            </Text>
          </View>
        </View>

        {/* =========================
            CÁMARA
        ========================== */}
        <View style={styles.cameraContainer}>

          {isCameraActive ? (
            permission?.granted ? (

              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="back"
              />

            ) : (

              <View style={styles.cameraPlaceholder}>
                <CameraIcon
                  color="#334155"
                  size={64}
                />

                <Text style={styles.cameraActiveText}>
                  Se necesita permiso para usar la cámara
                </Text>

                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestPermission}
                >
                  <CameraIcon
                    color="#ffffff"
                    size={18}
                  />

                  <Text style={styles.permissionButtonText}>
                    Conceder permiso
                  </Text>
                </TouchableOpacity>
              </View>

            )
          ) : (

            <View style={styles.cameraOffContainer}>
              <Power
                color="#64748b"
                size={48}
              />

              <Text style={styles.cameraOffText}>
                La cámara está apagada
              </Text>
            </View>

          )}

          {/* Indicador LIVE */}
          {isCameraActive && permission?.granted && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>
                CÁMARA ENCENDIDA
              </Text>
            </View>
          )}

          {/* Loading */}
          {isProcessing && (
            <View style={styles.overlayLoading}>
              <ActivityIndicator
                size="large"
                color="#38bdf8"
              />

              <Text style={styles.loadingText}>
                Procesando imagen con el modelo...
              </Text>
            </View>
          )}
        </View>

        {/* =========================
            BOTÓN CÁMARA
        ========================== */}
        <TouchableOpacity
          style={[
            styles.toggleCamButton,
            isCameraActive
              ? styles.btnOff
              : styles.btnOn,
          ]}
          onPress={toggleCamera}
        >
          <Power
            color="#ffffff"
            size={18}
          />

          <Text style={styles.toggleCamButtonText}>
            {isCameraActive
              ? 'Apagar Cámara'
              : 'Encender Cámara'}
          </Text>
        </TouchableOpacity>

        {/* =========================
            RESULTADOS
        ========================== */}
        <View style={styles.resultsContainer}>

          <View>
            <Text style={styles.resultLabel}>
              ÚLTIMO RESULTADO
            </Text>

            <Text style={styles.resultValue}>
              {detectedClass || 'Sin datos'}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.resultLabel}>
              CONFIANZA / PRECISIÓN
            </Text>

            <Text style={styles.confidenceValue}>
              {confidence || '0%'}
            </Text>
          </View>

        </View>

        {/* =========================
            BOTONES DE ACCIÓN
        ========================== */}
        <View style={styles.actionButtons}>

          {/* CAPTURAR */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!isCameraActive ||
                !permission?.granted ||
                isProcessing) &&
                styles.buttonDisabled,
            ]}
            onPress={handleCapture}
            disabled={
              !isCameraActive ||
              !permission?.granted ||
              isProcessing
            }
          >
            <CameraIcon
              color="#ffffff"
              size={20}
            />

            <Text style={styles.primaryButtonText}>
              Capturar y Enviar a Modelo
            </Text>
          </TouchableOpacity>

          {/* ESP32 */}
          <TouchableOpacity
            style={[
              styles.emeraldButton,
              (isProcessing || !detectedClass) &&
                styles.buttonDisabled,
            ]}
            onPress={onSendToESP32}
            disabled={isProcessing || !detectedClass}
          >
            <Send
              color="#ffffff"
              size={18}
            />

            <Text style={styles.primaryButtonText}>
              Enviar Resultado al ESP32
            </Text>
          </TouchableOpacity>

        </View>

        {/* =========================
            LOGS
        ========================== */}
        <TouchableOpacity
          style={styles.logsToggleButton}
          onPress={() => setShowLogsModal(true)}
        >
          <Terminal
            color="#38bdf8"
            size={18}
          />

          <Text style={styles.logsToggleButtonText}>
            Ver Terminal de Logs ({logs.length})
          </Text>
        </TouchableOpacity>

      </View>

      {/* =========================
          MODAL LOGS
      ========================== */}
      <LogsModal
        visible={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        logs={logs}
        onClear={onClearLogs}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },

  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    borderColor: '#334155',
    borderWidth: 1,
  },

  statusLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  dotOnline: {
    backgroundColor: '#10b981',
  },

  dotOffline: {
    backgroundColor: '#f43f5e',
  },

  dotUnknown: {
    backgroundColor: '#64748b',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },

  cameraContainer: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#020617',
    borderColor: '#334155',
    borderWidth: 1,
    position: 'relative',
  },

  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },

  cameraActiveText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },

  permissionButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },

  permissionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },

  cameraOffContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  cameraOffText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },

  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },

  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#38bdf8',
  },

  overlayLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  loadingText: {
    color: '#7dd3fc',
    fontSize: 13,
    fontWeight: '600',
  },

  toggleCamButton: {
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  btnOff: {
    backgroundColor: '#475569',
  },

  btnOn: {
    backgroundColor: '#0284c7',
  },

  toggleCamButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },

  resultsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },

  resultLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },

  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38bdf8',
  },

  confidenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },

  actionButtons: {
    gap: 8,
    marginTop: 4,
  },

  primaryButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  emeraldButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  logsToggleButton: {
    marginTop: 'auto',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  logsToggleButtonText: {
    color: '#38bdf8',
    fontWeight: '600',
    fontSize: 13,
  },
});
