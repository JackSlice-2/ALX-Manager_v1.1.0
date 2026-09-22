import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import useCheckDrivers from '@/hooks/useCheckDrivers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useT } from '@/hooks/useT';

interface I2cModalProps {
  onClose: () => void
  drivers: any
}

const I2cModal: React.FC<I2cModalProps> = ({ onClose, drivers: raw }) => {
  const t = useT()
 

  return (
    <>
       <ModalContainer
        visible
        onClose={onClose} 
        title={t.SettingsOptions.i2c}
        image={require('@/assets/images/wire.png')} 
        data={raw}
      >
        <View
            style={{
              width: '100%',
              borderRadius: 10,
              marginBottom: 10,
              marginTop: 10
            }}
          >
           
          </View>
      </ModalContainer>
      </>
  );
};

export default I2cModal;
