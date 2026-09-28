import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Send } from 'lucide-react-native';

export default function TestESP32Screen({
  classes = [],
  esp32Ip,
  onSendTest,
}) {
  const [selectedClass, setSelectedClass] = useState(classes[0] || '');
  const [percentage, setPercentage] = useState('100');

  useEffect(() => {
    if (!classes.includes(selectedClass)) {
      setSelectedClass(classes[0] || '');
    }
  }, [classes, selectedClass]);

  const handleSend = () => {
    const numericPercentage = Number(percentage);

    if (!selectedClass) {
      Alert.alert('Test ESP32', 'El modelo no tiene clases disponibles.');
      return;
    }

    if (
      percentage.trim() === '' ||
      !Number.isFinite(numericPercentage) ||
      numericPercentage < 0 ||
      numericPercentage > 100
    ) {
      Alert.alert('Porcentaje inválido', 'Ingresa un valor entre 0 y 100.');
      return;
    }

    onSendTest(selectedClass, numericPercentage);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Prueba manual</Text>
        <Text style={styles.description}>
          Selecciona una clase del modelo y define el porcentaje que recibirá el ESP32.
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>CLASE DEL MODELO</Text>
          <View style={styles.classList}>
            {classes.map((className) => (
              <TouchableOpacity
                key={className}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedClass === className }}
                style={[
                  styles.classOption,
                  selectedClass === className && styles.classOptionSelected,
                ]}
                onPress={() => setSelectedClass(className)}
              >
                <Text
                  style={[
                    styles.classText,
                    selectedClass === className && styles.classTextSelected,
                  ]}
                >
                  {className}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {classes.length === 0 && (
            <Text style={styles.emptyText}>No se cargaron clases del modelo.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>PORCENTAJE</Text>
          <TextInput
            value={percentage}
            onChangeText={setPercentage}
            keyboardType="decimal-pad"
            placeholder="100"
            placeholderTextColor="#64748b"
            style={styles.input}
          />
        </View>

        <Text style={styles.ipText}>
          ESP32: {esp32Ip || 'IP no configurada'}
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          disabled={!selectedClass}
          style={[styles.sendButton, !selectedClass && styles.buttonDisabled]}
          onPress={handleSend}
        >
          <Send color="#ffffff" size={18} />
          <Text style={styles.sendButtonText}>Enviar prueba al ESP32</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  heading: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginTop: -12,
  },
  section: {
    gap: 10,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  classList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classOption: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  classOptionSelected: {
    borderColor: '#34d399',
    backgroundColor: '#064e3b',
  },
  classText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  classTextSelected: {
    color: '#d1fae5',
    fontWeight: '600',
  },
  emptyText: {
    color: '#fbbf24',
    fontSize: 13,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    color: '#f8fafc',
    backgroundColor: '#020617',
    fontSize: 16,
  },
  ipText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  sendButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});