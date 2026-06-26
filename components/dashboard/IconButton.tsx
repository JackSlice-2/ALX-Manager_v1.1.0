import { router } from "expo-router";
import { Image, TouchableOpacity, View } from "react-native";
import RobotoText from "../RobotoText";

interface IconButtonProps {
  icon?: any;
  component?: any;
  link?: any;
  text?: string;
  option?: string;  // Add the option prop
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  link,
  text,
  component,
  option,  // Receiving the option
}) => {

  const handlePress = () => {
    if (option) {
      // Navigate to the settings page with the selected option
      router.push(`/settings?selectedOption=${option}`);
    }
  };

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    }}>
      <View>
        <RobotoText style={{fontWeight: 800, fontSize: 20}}>{text}</RobotoText>
      </View>
      {icon && (
        <TouchableOpacity 
          style={{ position: 'absolute', flexDirection: 'row', alignSelf: 'flex-end', right: 5, top: -25 }}
          onPress={handlePress}  // Use the handlePress to navigate
        >
          <Image source={icon} style={{ width: 30, height: 30 }} />
        </TouchableOpacity>
      )}
      <View style={{ position: 'absolute', right: 0, marginTop: 24 }}>
        {component && component}
      </View>
    </View>
  );
};

export default IconButton;
