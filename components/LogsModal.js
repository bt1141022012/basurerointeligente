import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Terminal, Trash2, X } from 'lucide-react-native';

export default function LogsModal({ visible, onClose, logs, onClear }) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Terminal color="#38bdf8" size={20} />
              <Text style={styles.title}>Registro de Eventos (Logs)</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
                <Trash2 color="#fb7185" size={18} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#94a3b8" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.consoleContainer}>
            {logs.length === 0 ? (
              <Text style={styles.emptyLogText}>No hay registros todavía...</Text>
            ) : (
              logs.map((log) => (
                <Text
                  key={log.id}
                  style={[
                    styles.logLine,
                    log.type === 'error'
                      ? styles.logError
                      : log.type === 'success'
                      ? styles.logSuccess
                      : log.type === 'warning'
                      ? styles.logWarning
                      : styles.logInfo,
                  ]}
                >
                  <Text style={styles.logTimestamp}>[{log.timestamp}] </Text>
                  {log.message}
                </Text>
              ))
            )}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: '60%',
    borderColor: '#334155',
    borderWidth: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  clearBtn: { padding: 4 },
  closeBtn: { padding: 4 },
  consoleContainer: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 12,
  },
  emptyLogText: {
    color: '#475569',
    fontStyle: 'italic',
    fontSize: 12,
  },
  logLine: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  logTimestamp: { color: '#475569' },
  logError: { color: '#fb7185' },
  logSuccess: { color: '#34d399' },
  logWarning: { color: '#fbbf24' },
  logInfo: { color: '#94a3b8' },
});