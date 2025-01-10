import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const LogButton = ({ onLog, darkTheme }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [buttonText, setButtonText] = useState("LOGGA");
  const textOpacity = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const isLongPressCompleted = useRef(false);

  const buttonBackgroundColor = darkTheme ? '#000' : '#fffdbd'; // Anpassa efter Streak-cirkeln
  const progressStartColor = darkTheme ? '#000' : '#008000'; // Anpassa gul för baren
  const progressEndColor = '#FFEB3B';
  const textColor = darkTheme ? '#FFF' : '#000';

  const handlePressIn = () => {
    setIsPressed(true);
    isLongPressCompleted.current = false;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(textOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setButtonText("HÅLL INNE");
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    Animated.timing(progress, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        isLongPressCompleted.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onLog(true);
        resetProgressBar();
      }
    });
  };

  const handlePressOut = () => {
    if (!isLongPressCompleted.current) {
      Animated.timing(progress).stop();
      resetProgressBar();
    }

    setTimeout(() => {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setButtonText("LOGGA");
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 500); // Fördröjning på 500 ms (justera vid behov)


    setIsPressed(false);
  };

  const resetProgressBar = () => {
    progress.setValue(0);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: buttonBackgroundColor }, isPressed && styles.buttonPressed]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [progressStartColor, progressEndColor],
              }),
            },
          ]}
        />
        <Animated.Text style={[styles.text, { opacity: textOpacity, color: textColor }]}>
          {buttonText}
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
};

export default LogButton;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: width * 0.4,
    height: height * 0.08,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderColor: '#333',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 35,
    zIndex: 0,
  },
  text: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    zIndex: 1,
  },
});