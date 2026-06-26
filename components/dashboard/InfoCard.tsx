import { StyleSheet, View } from "react-native";
import RobotoText from "../RobotoText";

interface InfoCardProps {
  label: string
  value: any
}

const InfoCard: React.FC<InfoCardProps> = ({
  label, 
  value
}) => (
  <View style={styles.card}>
    <RobotoText style={styles.cardLabel}>
      {label}
    </RobotoText>
    <RobotoText style={styles.cardValue}>{value}</RobotoText>
  </View>
);
export default InfoCard;

const styles = StyleSheet.create ({
card: {
    backgroundColor: 'rgb(233, 234, 235)',
    marginBottom: 7,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(236, 236, 236)',
    height: 80
  },
  cardLabel: {
    color: '#7a7676ff',
    fontSize: 15,
    marginVertical: 2
  },
  cardValue: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
})