import React, { useRef } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import InfoCard from "@/components/dashboard/InfoCard";
import LoaderOverlay from "@/components/LoaderOverlay";
import { useT } from "@/hooks/useT";
import { useInfoCards } from "@/utils/InfoCardsBluetooth";

interface ScreenOneProps {
  screenWidth: number;
  isSmallDevice: boolean;
}

const ScreenOne: React.FC<ScreenOneProps> = ({ 
  screenWidth, 
  isSmallDevice,
  }) => {
  const infoCards = useInfoCards();
  
  const translateY = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);

  return (
    <ScrollView horizontal contentContainerStyle={styles.scrollContainer}>
      <Animated.View
        style={{ transform: [{ translateY }] }}
      >
        <ScrollView
          scrollEnabled={!isDragging.current}
          contentContainerStyle={{ paddingTop: 5 }}
        >
          <View style={[styles.screen, styles.grid, { width: screenWidth }]}>
            
              <>
            {infoCards?.map((card, index) => (
              <View
                key={index}
                style={{
                  width: isSmallDevice ? "100%" : "48%",
                  marginBottom: 10
                }}
              >
                <InfoCard
                  label={card.label}
                  value={card.value}
                />
              </View>
            ))}
            </>
          </View>
        </ScrollView>
      </Animated.View>
    </ScrollView>
  );
};
export default ScreenOne;

const styles = StyleSheet.create({
  scrollContainer: {
    flexDirection: "row"
  },
  screen: {
    alignItems: "center",
    marginRight: 10
  },
  grid: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
