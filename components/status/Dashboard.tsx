import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions
} from 'react-native';
import { useInfoCards } from '../../utils/constants';
import InfoCard from '../dashboard/InfoCard';
import Loader from '../Loader';
import RobotoText from '../RobotoText';

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 750;
  const [loading, setLoading] = useState(true); // Initially set loading to true
  const infoCards = useInfoCards()
  // Simulate a 1.5-second loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Set loading to false after 1.5 seconds
    }, 1500);

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, []);

  return (
      <View style={styles.linearGradient}>
        <View>
          <View style={styles.information}>
            <Ionicons size={28} name="information-circle" />
            <RobotoText style={styles.cardValue}>Status</RobotoText>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {/* Info Grid */}
            {loading ? (
              <Loader />
            ) : (
              <View style={styles.grid}>
                {infoCards.map((card, index) => (
                  <View
                    key={index}
                    style={{
                      width: isSmallDevice ? '100%' : '48%',
                      marginBottom: 15,
                    }}
                  >
                    <InfoCard
                      label={card.label}
                      value={card.value}
                    />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    marginVertical: '50%',
  },
  grid: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linearGradient: {
    flex: 1,
    padding: 14,
    paddingTop: 10,
    backgroundColor: 'rgb(250, 251, 252)',
  },
  scrollViewContent: {
    padding: '2%',
    paddingTop: 20,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 7,
    borderWidth: 2,
    borderColor: 'rgba(226, 222, 222, 0.5)',
    flexDirection: 'row',
    gap: 5,
  },
  information: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: 'rgba(226, 222, 222, 0.5)',
    flexDirection: 'row',
    gap: 5,
    marginTop: 13,
  },
  cardLabel: {
    color: '#7a7676ff',
    fontSize: 15,
    marginVertical: 2,
  },
  cardValue: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    paddingTop: 2,
  },
});
