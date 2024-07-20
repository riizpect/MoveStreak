// Funktion för att beräkna skillnaden mellan två datum
function calculateDateDifference(startDate, endDate) {
  let start = new Date(startDate);
  let end = new Date(endDate);

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  // Justera om dagarna är negativa
  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }

  // Justera om månaderna är negativa
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

// Importera nödvändiga moduler och komponenter
import React, { useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import { StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity, Modal, Switch, Dimensions, Share} from 'react-native';
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Animatable from 'react-native-animatable';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ImageBackground } from 'react-native';
import grassBackground from './assets/grass_background.png'; // Använd rätt sökväg till din bild
import darkBackground from './assets/dark_background.png';

const { width, height } = Dimensions.get('window');

// Motivationscitat för löpning och promenad
const runningQuotes = [
  "Ge aldrig upp!",
  "Spring som vinden!",
  "Varje steg räknas.",
  "Mål är till för att nås.",
  "Din enda begränsning är du själv.",
  "Du klarar mer än du tror.",
  "Fortsätt framåt, alltid framåt.",
  "Löpning är frihet.",
  "Starkare för varje dag.",
  "Din resa, dina mål."
];

const walkingQuotes = [
  "En promenad om dagen håller doktorn borta.",
  "Steg för steg.",
  "Promenader för kropp och själ.",
  "Utforska världen ett steg i taget.",
  "Varje promenad är en seger.",
  "Promenera dig till hälsa.",
  "Man ångrar aldrig en promenad.",
  "Frisk luft och motion.",
  "Vandra med ett leende.",
  "Promenera mot dina mål.",
  "Långsamt men stadigt."
];

// Huvudkomponenten för appen
export default function App() {
  const [encouragementVisible, setEncouragementVisible] = useState(false);
  const [dateDifference, setDateDifference] = useState({ years: 0, months: 0, days: 0 });
  const [streakCount, setStreakCount] = useState(5);
  const [lastCheckedDate, setLastCheckedDate] = useState(new Date().toDateString());
  const [showFullDate, setShowFullDate] = useState(false);
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [tempNotificationTime, setTempNotificationTime] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notificationActive, setNotificationActive] = useState(false);
  const [motivationalQuote, setMotivationalQuote] = useState("Ge aldrig upp!");
  const [darkTheme, setDarkTheme] = useState(false);
  const [showTotalDistance, setShowTotalDistance] = useState(true);
  const [showMotivationalQuote, setShowMotivationalQuote] = useState(true);
  const [bestStreak, setBestStreak] = useState(0);
  const [showBestStreak, setShowBestStreak] = useState(true);
  const [retroactiveModalVisible, setRetroactiveModalVisible] = useState(false);
  const [retroactiveDate, setRetroactiveDate] = useState(new Date());
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [isRunLoggedToday, setIsRunLoggedToday] = useState(false);
  const [allowLogToday, setAllowLogToday] = useState(false);
  const [activityMode, setActivityMode] = useState('run'); // 'run' för löpning, 'walk' för promenader
  const [showCelebration, setShowCelebration] = useState(false);
  const [showShareButton, setShowShareButton] = useState(true);
  const [showRetroactiveButton, setShowRetroactiveButton] = useState(true);

  const streakRef = useRef(null);

  // Begär tillstånd för notiser
  const requestNotificationPermission = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Du måste tillåta notiser för att aktivera påminnelser!');
        return false;
      }
      return true;
    } else {
      alert('Måste använda fysisk enhet för Push Notiser');
      return false;
    }
  };

  // Färg för texten i DateTimePicker beroende på tema
  const getDatePickerTextColor = () => {
    return darkTheme ? '#FFFFFF' : '#000000';
  };

  // Bekräfta nollställning av streak-count
  const confirmResetStreakCount = () => {
    Alert.alert(
      "Bekräfta nollställning",
      "Är du säker på att du vill nollställa din nuvarande streak?",
      [
        {
          text: "Avbryt",
          style: "cancel"
        },
        {
          text: "Ja, nollställ",
          onPress: () => resetstreakCount()
        }
      ]
    );
  };

  // Nollställ streak-count
  const resetstreakCount = () => {
    if (streakCount > bestStreak) {
      setBestStreak(streakCount);
      saveSetting('bestStreak', streakCount);
    } 
    setStreakCount(0);
    setIsRunLoggedToday(false);
    saveSetting('streakCount', 0);
    saveSetting('isRunLoggedToday', false);
    Alert.alert('Streak nollställd', 'Din streak har blivit nollställd.');
  };

  const handleEncouragementClose = async () => {
    setEncouragementVisible(false);
    await AsyncStorage.setItem('encouragementShown', 'true');
  };
  

  // Bekräfta nollställning av bästa streak
  const confirmResetBestStreak = () => {
    Alert.alert(
      "Bekräfta nollställning",
      "Är du säker på att du vill nollställa din längsta streak?",
      [
        {
          text: "Avbryt",
          style: "cancel"
        },
        {
          text: "Ja, nollställ",
          onPress: () => {
            resetBestStreak();
          }
        }
      ]
    );
  };

  // Nollställ bästa streak
  const resetBestStreak = () => {
    if (streakCount >= bestStreak) {
      Alert.alert('Längsta streak ej nollställd', 'Din längsta streak kan inte vara lägre än din nuvarande streak.');
    } else {
      setBestStreak(streakCount);
      saveSetting('bestStreak', streakCount);
      Alert.alert('Längsta streak nollställd', 'Din längsta streak har blivit nollställd.');
    }
  };

  const today = new Date();


  //Hantera loggning av 
  const handleLogRun = async (success) => {
    const todayDateString = new Date().toDateString();
  
    if (success && !isRunLoggedToday) {
      if (streakCount >= 9999) {
        Alert.alert('Maximalt antal dagar uppnått', 'Du kan inte logga fler än 9999 dagar.');
        return;
      }
      const newStreakCount = streakCount + 1;
      setStreakCount(newStreakCount);
      setIsRunLoggedToday(true);
      saveSetting('isRunLoggedToday', true);
  
      if (newStreakCount > bestStreak) {
        setBestStreak(newStreakCount);
        await saveSetting('bestStreak', newStreakCount);
      }
  
      streakRef.current.rotate();
      await saveSetting('runLoggedDate', todayDateString);
      await saveSetting('streakCount', newStreakCount);
      setLogModalVisible(false);
    } else if (!success) {
      Alert.alert('Målet har inte uppnåtts', 'Kom ihåg att springa minst 1.61 km!');
      setLogModalVisible(false);
    } else {
      Alert.alert('Redan loggad', 'Du har redan loggat din aktivitet för idag.');
      setLogModalVisible(false);
    }
  };
  

  // Effekt-hook som körs när komponenten laddas
  useEffect(() => {
    registerForPushNotificationsAsync();
    loadSettings();
    setRandomQuote();
    checkDate();
  }, [activityMode]);

  useEffect(() => {

    // Detta är för att den ska kolla varje minut med checkDate
    const checkDateInterval = setInterval(() => {
      checkDate();
    }, 60000); // Check every minute (60000 ms)
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        checkDate();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(checkDateInterval); // Clear interval on component unmount
      subscription.remove();
    };
  }, []);


  // Registrera för pushnotiser
  const registerForPushNotificationsAsync = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('You need to enable notifications for this app to work properly!');
        return;
      }
    } else {
      alert('Must use physical device for Push Notifications');
    }
  };

  // Ladda inställningar från AsyncStorage
  const loadSettings = async () => {
    try {
      const timeString = await AsyncStorage.getItem('notificationTime');
      if (timeString !== null) {
        const savedTime = new Date(timeString);
        setNotificationTime(savedTime);
        setTempNotificationTime(savedTime);
        setNotificationActive(true);
      }
  
      const theme = await AsyncStorage.getItem('darkTheme');
      setDarkTheme(theme === 'true');
  
      const totalDistance = await AsyncStorage.getItem('showTotalDistance');
      setShowTotalDistance(totalDistance !== 'false');
  
      const motivationalQuote = await AsyncStorage.getItem('showMotivationalQuote');
      setShowMotivationalQuote(motivationalQuote !== 'false');
  
      const bestStreakString = await AsyncStorage.getItem('bestStreak');
      if (bestStreakString !== null) {
        setBestStreak(parseInt(bestStreakString));
      }
  
      const showBestStreakString = await AsyncStorage.getItem('showBestStreak');
      setShowBestStreak(showBestStreakString !== 'false');

      const showRetroactiveButtonString = await AsyncStorage.getItem('showRetroactiveButton');
      setShowRetroactiveButton(showRetroactiveButtonString !== 'false');
  
      const savedLastCheckedDate = await AsyncStorage.getItem('lastCheckedDate');
      if (savedLastCheckedDate !== null) {
        setLastCheckedDate(savedLastCheckedDate);
      }
  
      const savedRunLoggedDate = await AsyncStorage.getItem('runLoggedDate');
      const todayDateString = new Date().toDateString();
      
      const savedRunLoggedDateString = savedRunLoggedDate ? new Date(savedRunLoggedDate).toDateString() : null;
      
      if (savedRunLoggedDateString !== null && savedRunLoggedDateString === todayDateString) {
        setIsRunLoggedToday(true);
        console.log(`loadSettings - Run logged today: ${savedRunLoggedDateString}`);  // Lägg till denna rad
      } else {
        setIsRunLoggedToday(false);
        console.log(`loadSettings - Run not logged today: ${savedRunLoggedDateString}`);  // Lägg till denna rad
      }
      
      const savedStreakCount = await AsyncStorage.getItem('streakCount');
      if (savedStreakCount !== null) {
        setStreakCount(parseInt(savedStreakCount));
      } else {
        setStreakCount(0);
        saveSetting('streakCount', 0);
      }
  
      const savedActivityMode = await AsyncStorage.getItem('activityMode');
      if (savedActivityMode !== null) {
        setActivityMode(savedActivityMode);
      }
  
      const savedShowFullDate = await AsyncStorage.getItem('showFullDate');
      if (savedShowFullDate !== null) {
        setShowFullDate(savedShowFullDate === 'true');
      }

      const savedIsRunLoggedToday = await AsyncStorage.getItem('isRunLoggedToday');
      if (savedIsRunLoggedToday !== null) {
        setIsRunLoggedToday(savedIsRunLoggedToday === 'true');
      } else {
        setIsRunLoggedToday(false);
      }

    } catch (e) {
      console.error('Failed to load settings.', e);
    }
  };

  // Spara inställningar i AsyncStorage
  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (e) {
      console.error(`Failed to save setting ${key}.`, e);
    }
  };

  // Sätt ett slumpmässigt citat baserat på aktivitetstyp
  const setRandomQuote = () => {
    const quotes = activityMode === 'run' ? runningQuotes : walkingQuotes;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setMotivationalQuote(quotes[randomIndex]);
  };

  // Schemalägg dagliga notiser
  const scheduleDailyNotification = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!notificationActive) return;

    const trigger = new Date(notificationTime);
    trigger.setDate(new Date().getDate());
    if (trigger < new Date()) {
      trigger.setDate(trigger.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daglig påminnelse',
        body: `Glöm inte att logga din streak i appen!`,
      },
      trigger: {
        hour: trigger.getHours(),
        minute: trigger.getMinutes(),
        repeats: true,
      },
    });
  };

  // Schemalägg notis för streak
  const scheduleStreakNotification = async (streak) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Grattis!',
        body: `Du har uppnått din dagliga målsättning med ${streak} dagars ${activityMode === 'run' ? 'löpstreak' : 'promenadstreak'}!`,
      },
      trigger: null,
    });
  };

  // Hantera tidändring för notiser
  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      setTempNotificationTime(selectedTime);
    }
  };

  // Bekräfta tidändring för notiser
  const confirmTime = () => {
    setNotificationTime(tempNotificationTime);
    setNotificationActive(true);
    saveSetting('notificationTime', tempNotificationTime);
    saveSetting('notificationActive', true);
    scheduleDailyNotification();
    setSettingsVisible(true);
    setModalVisible(false);
  };

  // Avbryt tidändring för notiser
  const cancelTime = () => {
    setSettingsVisible(true);
    setModalVisible(false);
  };

  // Växla notisstatus
  const toggleNotification = async () => {
    if (!notificationActive) {
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        return;
      }
    }

    setNotificationActive(!notificationActive);
    if (notificationActive) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } else {
      scheduleDailyNotification();
    }
    saveSetting('notificationActive', !notificationActive);
  };

  // Kontrollera datum för att återställa streak vid behov
const checkDate = async () => {
  const currentDate = new Date().toDateString();
  const savedRunLoggedDate = await AsyncStorage.getItem('runLoggedDate');

  if (savedRunLoggedDate !== null) {
    const lastRunDate = new Date(savedRunLoggedDate);
    const dayDifference = Math.floor((new Date().getTime() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDifference > 1 && encouragementShown !== 'true') {
      // Om det har gått mer än en dag sedan senaste loggningen och uppmuntringsmeddelandet inte har visats
      resetstreakCount();
      setEncouragementVisible(true); // Visa uppmuntringsmeddelandet
      await AsyncStorage.setItem('encouragementShown', 'true'); // Sätt flaggan
    }
  }

  if (currentDate !== lastCheckedDate) {
    setLastCheckedDate(currentDate);
    saveSetting('lastCheckedDate', currentDate);
    setIsRunLoggedToday(false);

    if (savedRunLoggedDate === currentDate) {
      setIsRunLoggedToday(true);
    } else {
      setIsRunLoggedToday(false);
    }
  }
};


  // Växla visning av bästa streak
  const toggleBestStreak = () => {
    setShowBestStreak(!showBestStreak);
    saveSetting('showBestStreak', !showBestStreak);
  };

  // Växla tema mellan ljust och mörkt
  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
    saveSetting('darkTheme', !darkTheme);
  };

  // Växla visning av motivationscitat
  const toggleMotivationalQuote = () => {
    setShowMotivationalQuote(!showMotivationalQuote);
    saveSetting('showMotivationalQuote', !showMotivationalQuote);
  };

  // Dela streak på sociala medier
  const shareRunstreak = async () => {
    try {
      const result = await Share.share({
        message: `Jag har ${streakCount} dagars ${activityMode === 'run' ? 'löpstreak' : 'promenadstreak'}! #MoveStreakApp`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  // Sätt retroaktiv streak
  const setRetroactiveStreak = () => {
    const currentDate = new Date();
    const selectedDate = new Date(retroactiveDate);
    let daysSinceStart;
  
    if (selectedDate.toDateString() === currentDate.toDateString()) {
      daysSinceStart = 1;
      setIsRunLoggedToday(true);
      saveSetting('runLoggedDate', currentDate.toDateString());
    } else {
      daysSinceStart = Math.floor((currentDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  
    if (daysSinceStart > 9999) {
      Alert.alert('Maximalt antal dagar uppnått', 'Du kan inte logga fler än 9999 dagar.');
      return;
    }
  
    const wasRunLoggedToday = isRunLoggedToday;
    const previousStreakCount = streakCount;
  
    setStreakCount(daysSinceStart);
    setRetroactiveModalVisible(false);
  
    if (daysSinceStart > bestStreak) {
      setBestStreak(daysSinceStart);
      saveSetting('bestStreak', daysSinceStart);
    }
  
    if (wasRunLoggedToday) {
      const updatedStreakCount = daysSinceStart + 1;
      setStreakCount(updatedStreakCount);
      saveSetting('streakCount', updatedStreakCount);
  
      if (updatedStreakCount > bestStreak) {
        setBestStreak(updatedStreakCount);
        saveSetting('bestStreak', updatedStreakCount);
      }
      setIsRunLoggedToday(true);
      saveSetting('runLoggedDate', currentDate.toDateString());
    } else {
      if (daysSinceStart > bestStreak) {
        setBestStreak(daysSinceStart);
        saveSetting('bestStreak', daysSinceStart);
      }
    }
  
    setAllowLogToday(true);
  };

  return (
    <ImageBackground 
      source={darkTheme ? darkBackground : grassBackground} 
      style={styles.backgroundImage}
    >
      <View style={[styles.container, darkTheme && styles.darkContainer]}>
        <View style={[styles.header, darkTheme && styles.darkHeaderFooter]}>
          <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.menuIcon}>
            <Icon name="bars" size={30} color={darkTheme ? "#fff" : "#3E4A89"} />
          </TouchableOpacity>
          <Text style={[styles.title, darkTheme && styles.darkHeaderFooterText]}>
            MoveStreak <Icon name="heartbeat" size={30} color={darkTheme ? "#fff" : "#3E4A89"} />
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
        <Animatable.View ref={streakRef} animation="bounceIn" duration={1000} style={[styles.streakContainer, darkTheme && styles.darkCard]}>
  {showFullDate ? (
    (() => {
      const { years, months, days } = calculateDateDifference(new Date().setDate(new Date().getDate() - streakCount), new Date());
      return (
        <View style={styles.fullDateContainer}>
          <Text style={[styles.streakText, darkTheme && styles.darkText, { fontSize: 40 }]}>
            {years} år
          </Text>
          <Text style={[styles.streakText, darkTheme && styles.darkText, { fontSize: 40 }]}>
            {months} månader
          </Text>
          <Text style={[styles.streakText, darkTheme && styles.darkText, { fontSize: 40 }]}>
            {days} dagar
          </Text>
        </View>
      );
    })()
  ) : (
    <Text
      style={[
        styles.streakText,
        darkTheme && styles.darkText,
        { fontSize: streakCount.toString().length >= 4 ? 70 : 100 }
      ]}
    >
      {streakCount}
    </Text>
  )}
            <Text style={[styles.moveStreakText, darkTheme && styles.darkMoveStreakText]}>
            MoveStreak
          </Text>
</Animatable.View>

          {showBestStreak && (
            <Animatable.View animation="fadeIn" duration={1500} style={darkTheme ? styles.darkBestStreakCard : styles.bestStreakCard}>
              <Text style={darkTheme ? styles.darkBestStreakLabel : styles.bestStreakLabel}>Längsta streak:</Text>
              <Text style={darkTheme ? styles.darkBestStreakCount : styles.bestStreakCount}>{bestStreak} dagar</Text>
            </Animatable.View>
          )}

          <TouchableOpacity
            style={[styles.logButton, darkTheme && styles.darkButton]}
            onPress={() => setLogModalVisible(true)}
          >
            <Text style={[styles.logButtonText, darkTheme && styles.darkLogButtonText]}>Logga</Text>
          </TouchableOpacity>

          {showMotivationalQuote && (
            <View style={styles.quoteContainer}>
              <Text style={[styles.motivationalText, darkTheme && styles.darkText]}>"{motivationalQuote}"</Text>
            </View>
          )}

          {showRetroactiveButton && (
          <TouchableOpacity
            style={[styles.syncButton, darkTheme && styles.darkSyncButton, styles.moveDownButton]}
            onPress={() => setRetroactiveModalVisible(true)}
          >
            <Text style={darkTheme && styles.darkSyncButtonText}>Har du redan en tidigare streak?</Text>
          </TouchableOpacity>
          )}

          <Modal
            animationType="slide"
            transparent={true}
            visible={retroactiveModalVisible}
            onRequestClose={() => setRetroactiveModalVisible(false)}
          >
            <View style={styles.centeredView}>
              <View style={[styles.modalView, darkTheme && styles.darkModalView]}>
                <Text style={[styles.modalText, darkTheme && styles.darkText]}>Vilken dag var din första dag du {activityMode === 'run' ? 'sprang' : 'gick'}?</Text>
                <DateTimePicker
                  value={retroactiveDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    const currentDate = selectedDate || retroactiveDate;
                    setRetroactiveDate(currentDate);
                  }}
                  style={styles.dateTimePicker}
                  textColor={getDatePickerTextColor()}
                  maximumDate={today}
                />
                <TouchableOpacity
                  style={[styles.button, styles.buttonConfirm]}
                  onPress={setRetroactiveStreak}
                >
                  <Text style={styles.textStyle}>Bekräfta</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setRetroactiveModalVisible(false)}
                >
                  <Text style={styles.textStyle}>Avbryt</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
  animationType="slide"
  transparent={true}
  visible={encouragementVisible}
  onRequestClose={handleEncouragementClose}
>
  <View style={styles.centeredView}>
    <View style={[styles.modalView, darkTheme && styles.darkModalView]}>
      <Text style={[styles.modalText, darkTheme && styles.darkText]}>Din streak har återställts</Text>
      <Text style={[styles.modalText, darkTheme && styles.darkText]}>
        Det är okej att ha en dålig dag. Ta nya tag och börja om på din streak! Vi tror på dig!
      </Text>
      <TouchableOpacity
        style={[styles.button, styles.buttonConfirm]}
        onPress={handleEncouragementClose}
      >
        <Text style={styles.textStyle}>Okej</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>



          <Modal
            animationType="slide"
            transparent={true}
            visible={logModalVisible}
            onRequestClose={() => setLogModalVisible(false)}
          >
            <View style={styles.centeredView}>
              <View style={[styles.modalView, darkTheme && styles.darkModalView]}>
                <Text style={[styles.modalText, darkTheme && styles.darkText]}>Har du {activityMode === 'run' ? 'sprungit' : 'gått'} minst 1.61km idag?</Text>
                <TouchableOpacity
                  style={[styles.button, styles.buttonConfirm]}
                  onPress={() => handleLogRun(true)}
                >
                  <Text style={styles.textStyle}>Ja, såklart!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setLogModalVisible(false)}
                >
                  <Text style={styles.textStyle}>Avbryt</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
  animationType="slide"
  transparent={true}
  visible={settingsVisible}
  onRequestClose={() => setSettingsVisible(false)}
>
  <View style={styles.centeredView}>
    <View style={[styles.modalView, darkTheme && styles.darkModalView]}>
      <Text style={[styles.modalText, darkTheme && styles.darkText]}>Inställningar</Text>
      <View style={styles.switchContainer}>
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>Mörkt tema</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={darkTheme ? '#f5dd4b' : '#f4f3f4'}
          onValueChange={toggleTheme}
          value={darkTheme}
        />
      </View>
      <View style={styles.switchContainer}>
  <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>Visa år, månader och dagar</Text>
  <Switch
    trackColor={{ false: '#767577', true: '#81b0ff' }}
    thumbColor={showFullDate ? '#f5dd4b' : '#f4f3f4'}
    onValueChange={() => {
      setShowFullDate(!showFullDate);
      saveSetting('showFullDate', !showFullDate);
    }}
    value={showFullDate}
  />
</View>
      <View style={styles.switchContainer}>
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>Visa motiverande citat</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={showMotivationalQuote ? '#f5dd4b' : '#f4f3f4'}
          onValueChange={toggleMotivationalQuote}
          value={showMotivationalQuote}
        />
      </View>
      <View style={styles.switchContainer}>
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>Visa längsta streak</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={showBestStreak ? '#f5dd4b' : '#f4f3f4'}
          onValueChange={toggleBestStreak}
          value={showBestStreak}
        />
      </View>

      <View style={styles.switchContainer}>
  <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>Visa tidigare streak-knapp</Text>
  <Switch
    trackColor={{ false: '#767577', true: '#81b0ff' }}
    thumbColor={showRetroactiveButton ? '#f5dd4b' : '#f4f3f4'}
    onValueChange={() => {
      setShowRetroactiveButton(!showRetroactiveButton);
      saveSetting('showRetroactiveButton', !showRetroactiveButton);
    }}
    value={showRetroactiveButton}
  />
</View>


      <View style={styles.switchContainer}>
  <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>Visa dela-knappen</Text>
  <Switch
    trackColor={{ false: '#767577', true: '#81b0ff' }}
    thumbColor={showShareButton ? '#f5dd4b' : '#f4f3f4'}
    onValueChange={() => {
      setShowShareButton(!showShareButton);
      saveSetting('showShareButton', !showShareButton);
    }}
    value={showShareButton}
  />
</View>

      <View style={styles.notificationButtonContainer}>
  <Button
    icon={<Icon name={notificationActive ? "bell" : "bell-slash"} size={15} color="white" />}
    title={notificationActive ? "Notiser på" : "Notiser av"}
    buttonStyle={[
      styles.smallButton,
      notificationActive ? styles.activeButton : styles.inactiveButton,
    ]}
    onPress={toggleNotification}
    containerStyle={styles.smallButtonContainer}
  />
<Button
  icon={<Icon name="clock-o" size={15} color="white" />}
  title={`Påminnelse: ${notificationTime.getHours()}:${notificationTime.getMinutes() < 10 ? '0' : ''}${notificationTime.getMinutes()}`}
  buttonStyle={[styles.smallButton, { backgroundColor: '#42A5F5' }]}
  onPress={() => {
    setSettingsVisible(false);
    setModalVisible(true);
  }}
  containerStyle={styles.smallButtonContainer}
/>

</View>

      <View style={styles.switchContainer}>
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>Aktivitetsläge</Text>
        <TouchableOpacity
          onPress={() => {
            setActivityMode('run');
            saveSetting('activityMode', 'run');
          }}
          style={activityMode === 'run' ? styles.activeActivityButtonContainer : styles.inactiveActivityButtonContainer}
        >
          <Text style={[styles.activityButtonText, darkTheme && styles.darkActivityButtonText]}>Springa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setActivityMode('walk');
            saveSetting('activityMode', 'walk');
          }}
          style={activityMode === 'walk' ? styles.activeActivityButtonContainer : styles.inactiveActivityButtonContainer}
        >
          <Text style={[styles.activityButtonText, darkTheme && styles.darkActivityButtonText]}>Gå</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
  style={[styles.button, styles.buttonReset]}
  onPress={confirmResetStreakCount}
>
  <Text style={styles.textReset}>Nollställ din nuvarande streak</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.button, styles.buttonReset]}
  onPress={confirmResetBestStreak}
>
  <Text style={styles.textReset}>Nollställ längsta streak</Text>
</TouchableOpacity>

      <View style={styles.closeButtonWrapper}>
  <TouchableOpacity
    style={[styles.smallCloseButton, darkTheme && styles.darkCloseButton]}
    onPress={() => setSettingsVisible(false)}
  >
    <Icon name="times" size={20} color="#fff" />
  </TouchableOpacity>
</View>

  </View>
  </View>
</Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.centeredView}>
              <View style={[styles.modalView, darkTheme && styles.darkModalView]}>
                <Text style={[styles.modalText, darkTheme && styles.darkText]}>Välj tid</Text>
                <DateTimePicker
                  value={tempNotificationTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  style={styles.dateTimePicker}
                  textColor="black"
                />
                <TouchableOpacity
                  style={[styles.button, styles.buttonConfirm]}
                  onPress={confirmTime}
                >
                  <Text style={styles.textStyle}>Bekräfta</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={cancelTime}
                >
                  <Text style={styles.textStyle}>Avbryt</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {showShareButton && (
          <View style={styles.footerContainer}>
            <Button
              icon={<Icon name="share-alt" size={15} color="white" />}
              title=" Dela din MoveStreak"
              buttonStyle={[styles.button, { backgroundColor: '#42A5F5' }]}
              onPress={shareRunstreak}
              containerStyle={styles.buttonContainer}
            />
          </View>
          )}
        </ScrollView>
        <View style={[styles.footer, darkTheme && styles.darkHeaderFooter]}>
          <Text style={[styles.copyright, darkTheme && styles.darkHeaderFooterText]}>© Andreas Selin 2024</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

// Stilar för komponenterna
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  fullDateContainer: {
    alignItems: 'center',
  },
  quoteContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Lätt transparent bakgrund
    borderRadius: 10, // Rundade hörn för att se mer ut som en textcontainer
  },
  celebrationText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  motivationalText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#FFF', // Ändra textfärg till vit för bättre kontrast
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    padding: 0, // Lägg till padding för att ge lite avstånd från kanterna
  },

  moveStreakText: {
    position: 'absolute',
    bottom: '5%',
    left: '36%',
    fontSize: 12,
    color: '#777', // Diskret färg
    textAlign: 'right',
    opacity: 0.7, // Lätt genomskinlig för diskret utseende
  },
  darkMoveStreakText: {
    color: '#BBB', // Diskret färg för mörkt tema
  },

  streakContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffdbd', // Attraktiv bakgrundsfärg
    borderRadius: width * 0.4, // Gör det cirkulärt
    width: width * 0.6, // Bredd på cirkeln
    height: width * 0.6, // Höjd på cirkeln (samma som bredd för att göra den cirkulär)
    marginVertical: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5, // För skugga på Android
    borderWidth: 5,
    borderColor: '#FFD700',
  },
  streakText: {
    fontSize: 100, // Större textstorlek
    fontWeight: 'bold',
    color: '#3E4A89', // Textfärg som kontrasterar bakgrunden
  },
  logButton: {
    backgroundColor: '#fffdbd', // En mer iögonfallande färg
    borderRadius: 30, // Rundade hörn
    paddingHorizontal: 50, // Större horisontell padding
    paddingVertical: 20, // Större vertikal padding
    marginTop: 20,
    alignSelf: 'center',
    shadowColor: '#000', // Skugga
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5, // För skugga på Android
    borderWidth: 2, // Tjocklek på kanten
    borderColor: '#ddd', // Färg på kanten
  },
  logButtonText: {
    color: '#000', // Svart text
    fontWeight: 'bold',
    fontSize: 25, // Större text
    textAlign: 'center',
  },
  darkLogButtonText: {
    color: '#FFF', // Vit text för dark mode
  },
  activeActivityButtonContainer: {
    borderWidth: 3,
    borderColor: '#28a745', // Blå färg för aktiv knapp
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  inactiveActivityButtonContainer: {
    borderWidth: 2,
    borderColor: '#ddd', // Grå färg för inaktiv knapp
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  darkActivityButtonText: {
    color: '#FFF', // Vit text för dark mode
  },
  notificationButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  smallButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  smallButtonContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  activeButton: {
    backgroundColor: '#4CAF50', // Grön färg för aktiverad knapp
  },
  inactiveButton: {
    backgroundColor: '#f44336', // Röd färg för inaktiverad knapp
  },
  container: {
    flex: 1,
    backgroundImage: 'url(./assets/grass_background.png)', // Lägg till denna rad
    backgroundSize: 'cover', // Lägg till denna rad
    backgroundRepeat: 'no-repeat', // Lägg till denna rad
    backgroundPosition: 'center', // Lägg till denna rad
  },
  darkContainer: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Ändra denna rad
  },
  footerContainer: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  darkHeaderFooter: {
    backgroundColor: '#333',
  },
  darkHeaderFooterText: {
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3E4A89', // Ändra denna rad för att matcha hjärt-ikonen
  },
  darkTitle: {
    color: '#fff',
  },
  menuIcon: {
    padding: 10,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  bestStreakCard: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 150,
    height: 90, // Sätt en fast höjd
    borderRadius: 10,
    backgroundColor: '#3E4A89',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'center', // Centrera innehållet
    paddingHorizontal: 10, // Liten horisontell padding
  },
  darkBestStreakCard: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 150,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#1f1f1f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  bestStreakLabel: {
    fontSize: 16,
    color: '#2E7D32', // Ändra denna rad
    textAlign: 'center',
    marginBottom: 2,
  },
  bestStreakCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32', // Ändra denna rad
    textAlign: 'center',
  },
  darkBestStreakLabel: {
    fontSize: 16,
    color: '#FFF', // Vit text för dark mode
    textAlign: 'center',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  darkBestStreakCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF', // Vit text för dark mode
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  streakCard: {
    width: '100%',
    borderRadius: 50,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Ändra denna rad
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  darkCard: {
    backgroundColor: '#1f1f1f',
  },
  streakInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'flex-end',
  },
  streakLeft: {
    alignItems: 'flex-start',
  },
  streakCenter: {
    alignItems: 'center',
  },
  streakRight: {
    alignItems: 'flex-end',
  },
  streakLabel: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 5,
  },
  streakCount: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#fff',
  },
  bestStreakLabel: {
    fontSize: 16,
    color: '#fff',
  },
  bestStreakCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  dailyGoalLabel: {
    fontSize: 16,
    color: '#fff',
  },
  dailyGoalIcon: {
    fontSize: 20,
  },
  dailyGoalIconSuccess: {
    color: 'green',
    fontSize: 20,
  },
  dailyGoalIconFailure: {
    color: '#F44336',
    fontSize: 20,
  },
  dailyGoalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 10,
  },
  closeButtonWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ee5612', // Röd bakgrund
    borderRadius: 20,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000', // Svart skugga
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5, // För skugga på Android

  },
  buttonClose: {
    backgroundColor: '#ee5612',
  },
  darkText: {
    color: '#FFF', // Vit text för dark mode
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    padding: 0, // Lägg till padding för att ge lite avstånd från kanterna
  },
  label: {
    fontSize: 18,
    color: '#3E4A89',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#3E4A89',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  buttonContainer: {
    width: '50%',
    marginTop: 10,
  },
  buttonReset: {
    backgroundColor: '#ff6f61', // Ny färg för nollställ-knappen
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
    alignSelf: 'center',
    shadowColor: '#000', // Skugga
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5, // För skugga på Android
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textReset: {
    color: '#fff', // Vit text
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 10, // Minska marginalen runt modalen
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20, // Minska paddingen
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  darkModalView: {
    backgroundColor: '#333',
    borderRadius: 20,
    padding: 20, // Minska paddingen
  },
  buttonConfirm: {
    backgroundColor: '#28A745',
    marginTop: 10,
  },
  buttonCancel: {
    backgroundColor: '#ee5612',
    marginTop: 10,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateTimePicker: {
    width: '100%',
    height: 150,
  },
  notificationInfoContainer: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationInfoText: {
    fontSize: 16,
    color: '#3E4A89',
    marginBottom: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 8, // Minska toppmarginalen
    marginVertical: 3, // Minska vertikalmarginalen
  },
  modalLabel: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncButton: {
    backgroundColor: '#fffdbd', // Bakgrundsfärg
    borderRadius: 10, // Rundade hörn
    paddingHorizontal: 20, // Mindre horisontell padding
    paddingVertical: 10, // Mindre vertikal padding
    marginTop: 10, // Mindre toppmarginal
    alignSelf: 'center',
    shadowColor: '#000', // Skugga
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5, // För skugga på Android
    borderWidth: 1, // Tjocklek på kanten
    borderColor: '#ddd', // Färg på kanten
  },
  darkSyncButton: {
    backgroundColor: '#1f1f1f',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#555',
  },
  darkSyncButtonText: {
    color: '#FFF', // Vit text för dark mode
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  moveDownButton: {
    marginTop: 50,
  },
  darkButton: {
    backgroundColor: '#1f1f1f',
    borderRadius: 30,
    paddingHorizontal: 50,
    paddingVertical: 20,
    marginTop: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#555',
  },
  footer: {
    padding: 10,
    backgroundColor: '#E8EAF6',
    alignItems: 'center',
  },
  copyright: {
    fontSize: 12,
    color: '#3E4A89',
    textAlign: 'center',
  },
});
