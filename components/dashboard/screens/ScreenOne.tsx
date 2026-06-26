import React, { useRef } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import InfoCard from "../../../components/dashboard/InfoCard";
import LoaderOverlay from "@/components/LoaderOverlay";
import { useT } from "@/hooks/useT";
import { useInfoCards } from "@/utils/InfoCards";

interface ScreenOneProps {
  screenWidth: number;
  isSmallDevice: boolean;
}

const ScreenOne: React.FC<ScreenOneProps> = ({ 
  screenWidth, 
  isSmallDevice,
  }) => {
  const t = useT();
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
            {infoCards === null || infoCards.length === 0 ? (
              <View style={{position: 'absolute', top: 50, left: 0, right: 0, bottom: 0, height: 200}}>
              <LoaderOverlay visible message={t.System.LoadingInfo} />
            </View>
            ) : (
              <>
            {infoCards.map((card, index) => (
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
          )}
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
