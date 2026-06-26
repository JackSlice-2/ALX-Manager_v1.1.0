import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import RobotoText from "../../RobotoText";

interface ModalHeaderProps {
  onClose?: any
  image?: any
  title?: string
  headerButton?: boolean
  onPress?: any
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  onClose,
  image,
  title,
  headerButton,
  onPress
}) => {
    return (
      <>
         <View style={styles.headerRow}>
          {image &&

        <Image source={image} style={styles.headerImage} />
        }
        {title &&

            <RobotoText style={styles.title}>{title}</RobotoText>
        }

        </View>
        {onClose &&
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <RobotoText style={styles.closeText}>✖</RobotoText>
        </TouchableOpacity>
        }
        {headerButton &&
              <TouchableOpacity style={{ marginTop: -40, marginBottom: 14, flexDirection: 'row', backgroundColor: '#f7f7f7ff', padding: 10, borderRadius: 40, alignSelf: 'flex-end' }}
                            onPress={onPress}>
                            <Image source={require('../../../assets/images/SVG/icons8-add-250.png')} style={{ width: 30, height: 30}} />
                            <RobotoText style={{paddingTop: 6, paddingLeft: 4}}>Adcionar</RobotoText>
                          </TouchableOpacity>
                          }
      </>
    )
}

export default ModalHeader

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  headerImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    marginRight: 8,
    marginBottom: 6,
  },
  inputGroup: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#f7f7f7ff',
    borderRadius: 10,
    padding: 5
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 7,
  },
  closeText: {
    fontSize: 25,
    marginTop: -10,
    color: '#000',
  },
});
