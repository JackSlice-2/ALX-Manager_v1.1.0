import { View } from "react-native";
import RobotoText from "../RobotoText";

interface SIgnalBarsProps {
  level: number,
  text?: string
}

const SignalBars: React.FC<SIgnalBarsProps> = ({
  level,
  text 
  })=> {
  const totalBars = 5;

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      {/* Left side: Connected label */}
      <RobotoText style={{fontWeight: 500, fontSize: 18}}>{text}</RobotoText>

      {/* Right side: Signal bars */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
        {[...Array(totalBars)].map((_, i) => {
          const active = i < level;
          return (
            <View
              key={i}
              style={{
                width: 6,
                height: 6 + i * 6,
                backgroundColor: active ? '#70a1e9ff' : 'rgba(189, 189, 189, 1)',
                borderRadius: 2,
              }}
            />
          );
        })}
      </View>
    </View>
  );
};

export default SignalBars;
