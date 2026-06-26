import { StyleSheet, View } from 'react-native';
import RobotoText from '../RobotoText';

type BatteryProps = {
  level: number;
  invertColors?: boolean;
};

const Battery = ({ level, invertColors = false }: BatteryProps) => {
  // Color logic
  const getFillColor = () => {
    if (!invertColors) {
      return level > 60 ? 'rgb(217, 231, 249)' : level > 30 ? 'rgb(217, 231, 249)' : 'rgb(217, 231, 249)';
    } else {
      return level > 60 ? 'rgb(217, 231, 249)' : level > 30 ? 'rgb(217, 231, 249)' : 'rgb(217, 231, 249)';
    }
  };

  const fillColor = getFillColor();

  return (
    <View style={styles.wrapper}>
      <View style={styles.batteryContainer}>
        <View
          style={[
            styles.batteryLevel,
            {
              width: `${level}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
        <View style={styles.batteryCap} />
      </View>
      <RobotoText style={[styles.batteryText, { color: invertColors ? '#fff' : '#000' }]}>
        {level}%
      </RobotoText>
    </View>
  );
};

export default Battery;


const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryContainer: {
    marginVertical: 3,
    height: 22,
    flex: 1,
    backgroundColor: 'rgb(237, 238, 240)',
    borderColor: 'rgb(237, 238, 240)',
    borderWidth: 1,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  batteryLevel: {
    height: '100%',
  },
  batteryCap: {
    position: 'absolute',
    right: -6,
    top: 4,
    height: 8,
    width: 3,
    backgroundColor: '#0ff',
    borderRadius: 1,
  },
  batteryText: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'right',
  },
});
