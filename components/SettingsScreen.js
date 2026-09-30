import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wifi, Sliders, Download, HardDrive, CheckCircle2 } from 'lucide-react-native';

export default function SettingsScreen({
  esp32Ip,
  setEsp32Ip,
  modelUrl,
  setModelUrl,
  modelMode,
  setModelMode,
  autoSend,
  setAutoSend,
  logsEnabled,
  setLogsEnabled,
  downloadedModelInfo,
  isModelLoading,
  modelReady,
  modelError,
  onDownloadModel,
  onLoadDownloadedModel,
  pingESP32,
  onSaveSettings,
}) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Sliders color="#38bdf8" size={22} />
            <Text style={styles.cardTitle}>Parámetros del Sistema</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección IP del ESP32:</Text>
            <View style={styles.rowInput}>
              <TextInput
                value={esp32Ip}
                onChangeText={setEsp32Ip}
                placeholder="Ej. 192.168.1.100"
                placeholderTextColor="#64748b"
                style={[styles.textInput, { flex: 1 }]}
                keyboardType="numeric"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.secondaryButton} onPress={pingESP32}>
                <Wifi color="#e2e8f0" size={16} />
                <Text style={styles.secondaryButtonText}>Probar IP</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Origen del modelo:</Text>
            <View style={styles.modeSelector}>
              {[
                { value: 'remote', label: 'Remoto' },
                { value: 'local', label: 'Local' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: modelMode === option.value }}
                  style={[
                    styles.modeOption,
                    modelMode === option.value && styles.modeOptionSelected,
                  ]}
                  onPress={() => setModelMode(option.value)}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      modelMode === option.value && styles.modeOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {modelMode === 'remote' ? (
              <>
                <Text style={styles.inputLabel}>URL base del modelo:</Text>
                <TextInput
                  value={modelUrl}
                  onChangeText={setModelUrl}
                  placeholder="https://teachablemachine.withgoogle.com/models/.../"
                  placeholderTextColor="#64748b"
                  style={styles.textInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </>
            ) : (
              <Text style={styles.toggleSubtitle}>
                Usa el modelo incluido en la aplicación y no requiere internet.
              </Text>
            )}
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Envío Automático al ESP32</Text>
              <Text style={styles.toggleSubtitle}>
                Enviar el resultado al ESP32 automáticamente tras ser inferido por el modelo
              </Text>
            </View>
            <Switch
              value={autoSend}
              onValueChange={setAutoSend}
              trackColor={{ false: '#334155', true: '#0284c7' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Registro de logs</Text>
              <Text style={styles.toggleSubtitle}>
                Registrar eventos, tiempos y resultados de la aplicación
              </Text>
            </View>
            <Switch
              accessibilityLabel="Activar registro de logs"
              value={logsEnabled}
              onValueChange={setLogsEnabled}
              trackColor={{ false: '#334155', true: '#0284c7' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.modelSection}>
            <View style={styles.cardHeader}>
              <HardDrive color="#38bdf8" size={20} />
              <Text style={styles.toggleTitle}>Modelo de IA</Text>
            </View>
            <Text style={styles.toggleSubtitle}>
              {modelReady
                ? 'Modelo cargado y listo para esta sesión.'
                : downloadedModelInfo
                ? 'Hay una copia guardada en el dispositivo para usar sin internet.'
                : modelMode === 'local'
                ? 'El modelo está incluido en la aplicación; cárgalo cuando lo necesites.'
                : 'El modelo no está descargado. Necesitarás internet para descargarlo.'}
            </Text>

            {downloadedModelInfo?.sourceUrl ? (
              <Text style={styles.modelSource} numberOfLines={2}>
                Descargado desde: {downloadedModelInfo.sourceUrl}
              </Text>
            ) : null}

            {modelMode === 'remote' && (
              <TouchableOpacity
                accessibilityRole="button"
                disabled={isModelLoading}
                style={[styles.modelButton, isModelLoading && styles.buttonDisabled]}
                onPress={onDownloadModel}
              >
                {isModelLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Download color="#ffffff" size={18} />
                )}
                <Text style={styles.saveButtonText}>
                  {isModelLoading
                    ? 'Descargando y guardando...'
                    : downloadedModelInfo
                    ? 'Descargar / actualizar modelo'
                    : 'Descargar para usar sin internet'}
                </Text>
              </TouchableOpacity>
            )}

            {modelMode === 'local' && (
              <TouchableOpacity
                accessibilityRole="button"
                disabled={isModelLoading}
                style={[styles.modelButton, isModelLoading && styles.buttonDisabled]}
                onPress={onDownloadModel}
              >
                {isModelLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <CheckCircle2 color="#ffffff" size={18} />
                )}
                <Text style={styles.saveButtonText}>
                  {isModelLoading ? 'Cargando modelo...' : 'Cargar modelo local'}
                </Text>
              </TouchableOpacity>
            )}

            {downloadedModelInfo && !modelReady && (
              <TouchableOpacity
                accessibilityRole="button"
                disabled={isModelLoading}
                style={[styles.offlineButton, isModelLoading && styles.buttonDisabled]}
                onPress={onLoadDownloadedModel}
              >
                {isModelLoading ? (
                  <ActivityIndicator color="#d1fae5" size="small" />
                ) : (
                  <HardDrive color="#d1fae5" size={18} />
                )}
                <Text style={styles.offlineButtonText}>
                  {isModelLoading ? 'Cargando desde el dispositivo...' : 'Cargar modelo sin conexión'}
                </Text>
              </TouchableOpacity>
            )}

            {modelError ? <Text style={styles.modelError}>{modelError}</Text> : null}
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() =>
              onSaveSettings(esp32Ip, autoSend, modelMode, modelUrl, logsEnabled)
            }
          >
            <Text style={styles.saveButtonText}>Guardar configuración</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderColor: '#334155',
    borderWidth: 1,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  rowInput: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    backgroundColor: '#020617',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: '600',
  },
  modeSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modeOption: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
  },
  modeOptionSelected: {
    backgroundColor: '#075985',
  },
  modeOptionText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  modeOptionTextSelected: {
    color: '#f0f9ff',
  },
  saveButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0284c7',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#f1f5f9',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  modelSection: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.7)',
  },
  modelSource: {
    color: '#64748b',
    fontSize: 10,
  },
  modelButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
  },
  offlineButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    backgroundColor: '#064e3b',
    paddingHorizontal: 10,
  },
  offlineButtonText: {
    color: '#d1fae5',
    fontSize: 13,
    fontWeight: '600',
  },
  modelError: {
    color: '#fda4af',
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});