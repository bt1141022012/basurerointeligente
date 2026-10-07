import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Send, Sliders, Cpu, Globe } from 'lucide-react-native';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Cpu color="#38bdf8" size={40} />
          </View>
          <Text style={styles.title}>Vision AI & ESP32</Text>
          <Text style={styles.subtitle}>Panel de control e integración IoT</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Camera')}
          >
            <View style={[styles.cardIcon, { backgroundColor: 'rgba(2, 132, 199, 0.2)' }]}>
              <Camera color="#38bdf8" size={30} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Cámara y Captura</Text>
              <Text style={styles.cardDescription}>
                Captura, envía fotos al modelo y gestiona la comunicación
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('TestESP32')}
          >
            <View style={[styles.cardIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Send color="#34d399" size={30} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Test ESP32</Text>
              <Text style={styles.cardDescription}>
                Envía una clase del modelo con un porcentaje manual
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ESP32Viewer')}
          >
            <View style={[styles.cardIcon, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
              <Globe color="#38bdf8" size={30} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Sitio del ESP32</Text>
              <Text style={styles.cardDescription}>
                Abre el sitio web servido por el ESP32 usando su dirección IP
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={[styles.cardIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Sliders color="#34d399" size={30} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Configuración</Text>
              <Text style={styles.cardDescription}>
                Ajusta la IP del ESP32 y el endpoint del modelo de IA
              </Text>
            </View>
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
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 40,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    padding: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    borderRadius: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#38bdf8',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  menuContainer: {
    gap: 16,
  },
  menuCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#334155',
    borderWidth: 1,
    gap: 16,
  },
  cardIcon: {
    padding: 12,
    borderRadius: 14,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
});