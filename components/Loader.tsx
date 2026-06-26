import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

interface LoaderProps {
  size?: number
  style?: any
}

const Loader: React.FC<LoaderProps> = ({
  size,
  style
}) => {
  return (
    <View style={style || styles.loaderContainer}>
        <ActivityIndicator size={size || 110} color="#888888ff" />
    </View>
  )
}

export default Loader

const styles = StyleSheet.create({
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '50%'
  }})