import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import RobotoText from '../../../components/RobotoText'
import { handleSave } from '../constants'
import { useT } from '@/hooks/useT'

interface SaveButtonProps {
    isSaveDisabled: boolean
    text?: string
    onPress?: any
}
const SaveButton: React.FC<SaveButtonProps> = ({
    isSaveDisabled,
    text,
    onPress
}) => {
 const t = useT()

  return (
      <View style={styles.buttonRow}>
        <TouchableOpacity
        onPress={onPress || handleSave}
        style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]}
        disabled={isSaveDisabled}
        >
        <RobotoText style={styles.buttonText}>{text || t.System.Save}</RobotoText>
        </TouchableOpacity>
    </View>
  )
}

export default SaveButton

const styles = StyleSheet.create({

  saveButtonDisabled: {
    backgroundColor: '#c3d3ddff',
    justifyContent: 'center',
    width: '100%'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',  // Ensure it takes up the full width of the modal container
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#007ACC',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    width: '100%'
  },
})