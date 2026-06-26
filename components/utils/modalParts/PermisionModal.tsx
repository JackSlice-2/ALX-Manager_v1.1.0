// File: app/components/PermissionModal.tsx
import RobotoText from '@/components/RobotoText';
import React from 'react';
import { Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

type PermissionModalProps = {
  visible: boolean;
  icon: any;
  title: string;
  message: string;
  onOpenSettings: () => void;
  onRefresh: () => void;
};

export default function PermissionModal({
  visible,
  icon,
  title,
  message,
  onOpenSettings,
  onRefresh
}: PermissionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Image source={icon} style={{ width: 70, height: 70, marginBottom: 12 }} />
          <RobotoText style={styles.modalTitle}>{title}</RobotoText>
          <RobotoText style={styles.modalText}>{message}</RobotoText>
          <TouchableOpacity style={styles.modalButton} onPress={onOpenSettings}>
            <RobotoText style={styles.modalButtonText}>Abrir Configurações</RobotoText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={onRefresh}>
            <RobotoText style={[styles.modalButtonText, { color: '#000' }]}>Já Ativei</RobotoText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
    maxWidth: '100%',
  },
  modalButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
