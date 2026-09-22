import React from 'react';
import { View } from 'react-native';
import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import { useT } from '@/hooks/useT';

interface GeneralModalProps {
  onClose: () => void
  datalogger: any
}

const GeneralModal: React.FC<GeneralModalProps> = ({ onClose, datalogger }) => {
  const t = useT()

  return (
       <ModalContainer
        visible
        onClose={onClose} 
        title={t.SettingsOptions.General}
        image={require('@/assets/images/gears.png')}
        data={datalogger}
      >
              <View>
             
            
            </View>
      </ModalContainer>
  );
};

export default GeneralModal;
