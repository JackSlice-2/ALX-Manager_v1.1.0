import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import RobotoText from './RobotoText';

interface PageContainerProps {
    children: any
    image: any
    title: string
}

const PageContainer: React.FC<PageContainerProps> = ({
    children,
    image,
    title
}) => {

  return (
      <View style={styles.linearGradient}>
        <View>
          <View style={styles.information}>
            <Image
              source={image}
              style={{ width: 30, height: 30, alignSelf: 'flex-start'}}
            />
            <RobotoText style={styles.cardValue}>{title}</RobotoText>
          </View>
          <KeyboardAwareScrollView
            enableOnAndroid
            extraScrollHeight={80}
            keyboardOpeningTime={0}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {children}
          </KeyboardAwareScrollView>

        </View>
      </View>
  );
}

export default PageContainer;

const styles = StyleSheet.create({
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
  information: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: 'rgba(226, 222, 222, 0.5)',
    flexDirection: 'row',
    gap: 5,
    marginTop: 13,
    marginBottom: 5,
  },
  cardValue: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    paddingTop: 2,
  },
});
