import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import { Wifi, Sliders } from 'lucide-react-native';

export default function SettingsScreen({
  esp32Ip,
  setEsp32Ip,
  modelUrl,
  setModelUrl,
  autoSend,
  setAutoSend,
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
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => onSaveSettings(esp32Ip, autoSend)}
            >
              <Text style={styles.secondaryButtonText}>Guardar IP</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>URL del Modelo de IA:</Text>
            <TextInput
              value={modelUrl}
              onChangeText={setModelUrl}
              placeholder="https://tu-servidor-modelo.com/predict"
              placeholderTextColor="#64748b"
              style={styles.textInput}
              autoCapitalize="none"
            />
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
});