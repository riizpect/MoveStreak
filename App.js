function calculateDateDifference(startDate, endDate) {
  let start = new Date(startDate);
  let end = new Date(endDate);

  // Sätt tiden till midnatt för båda datumen
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

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

  console.log(`Beräknad skillnad: ${years} år, ${months} månader, ${days} dagar`);
  return { years, months, days };
}

// Importera nödvändiga moduler och komponenter
import React, { useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import { Platform } from 'react-native';
import { StyleSheet, Text, View, Alert, FlatList, Animated, ScrollView, TouchableOpacity, Modal, Switch, Dimensions, Share} from 'react-native';
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
import oliveBackground from './assets/olive_background.png';
import cloudBackground from './assets/cloud_background.png';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Insights from 'expo-insights';

import * as Application from 'expo-application';

const checkAppVersion = async () => {
  const currentVersion = Application.nativeApplicationVersion || '1.0.0'; // Hämta nuvarande version
  console.log('Aktuell version:', currentVersion); // Lägg till detta
  const savedVersion = await AsyncStorage.getItem('appVersion'); // Hämta sparad version
  console.log('Sparad version:', savedVersion); // Lägg till detta

  if (savedVersion !== currentVersion) {
    // Ny version upptäckt
    console.log(`Ny version upptäckt: ${currentVersion} (tidigare: ${savedVersion})`);
    await AsyncStorage.setItem('appVersion', currentVersion); // Uppdatera version i AsyncStorage
    return true; // Indikerar att det är en ny version
  }

  return false; // Ingen ny version
};



const { width, height } = Dimensions.get('window');

// Motivationscitat för löpning och promenad
const runningQuotes = [
  "Ge aldrig upp!",
  "Spring som vinden!",
  "Mål är till för att nås.",
  "Din enda begränsning är du själv.",
  "Du klarar mer än du tror.",
  "Fortsätt framåt, alltid framåt.",
  "Löpning är frihet.",
  "Starkare för varje dag.",
  "Din resa, dina mål.",
  "Man ångrar aldrig ett löppass",
  "Målet är bara början"
];

const walkingQuotes = [
  "En promenad om dagen håller doktorn borta.",
  "Steg för steg.",
  "Varje steg räknas.",
  "Promenader för kropp och själ.",
  "Utforska världen ett steg i taget.",
  "Varje promenad är en seger.",
  "Promenera dig till hälsa.",
  "Man ångrar aldrig en promenad.",
  "Frisk luft och motion.",
  "Vandra med ett leende.",
  "Hälsa och lycka börjar med en promenad",
  "Promenera mot dina mål.",
  "Långsamt men stadigt."
];

const cyclingQuotes = [
  "Cykla mot vinden!",
  "Friheten på två hjul.",
  "Trampa vidare!",
  "Man ångrar aldrig en cykeltur :)",
  "Vind i håret, frihet i själen.",
  "Varje tramp är ett steg närmare ditt mål.",
  "En dag utan cykling är en dag förlorad.",
  "Trampa bort alla bekymmer"
  // Lägg till fler citat här
];

const workoutQuotes = [
  "Starkare för varje dag.",
  "Ge inte upp!",
  "Din enda begränsning är du själv.",
  "Heja heja!",
  "Ge aldrig upp på en dröm bara för att det tar tid att nå den.",
  "Träning är den bästa investeringen du kan göra i dig själv.",
  // Lägg till fler citat här
];


// Huvudkomponenten för appen
export default function App() {
  const [encouragementVisible, setEncouragementVisible] = useState(false);
  const [encouragementShown, setEncouragementShown] = useState(false);
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
  const [activityMode, setActivityMode] = useState('run'); // 'run' 'walk', 'cykling', 'workout'.
  const [showCelebration, setShowCelebration] = useState(false);
  const [showShareButton, setShowShareButton] = useState(true);
  const [showRetroactiveButton, setShowRetroactiveButton] = useState(true);
  const [isRetroactiveDatePickerVisible, setRetroactiveDatePickerVisibility] = useState(false);
  const [isNotificationDatePickerVisible, setNotificationDatePickerVisibility] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(grassBackground);
  const [streakStartDate, setStreakStartDate] = useState(new Date());
  const [selectedBackground, setSelectedBackground] = useState('grass'); // Default bakgrund
  const [sound, setSound] = useState();
  const [streakHistory, setStreakHistory] = useState([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newStartDate, setNewStartDate] = useState(new Date());
  const [newEndDate, setNewEndDate] = useState(new Date());
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const loadStreakHistory = async () => {
    try {
      const history = await getStreakHistory();
      setStreakHistory(history);
  
      // Kontrollera längsta streak från historiken
      let longestStreakFromHistory = 0;
      history.forEach((streak) => {
        if (streak.length > longestStreakFromHistory) {
          longestStreakFromHistory = streak.length;
        }
      });
  
      // Jämför med den aktuella streaken
      const longestStreakOverall = Math.max(longestStreakFromHistory, streakCount);
      setBestStreak(longestStreakOverall);
      await saveSetting('bestStreak', longestStreakOverall);
    } catch (error) {
      console.error("Error loading streak history:", error);
    }
  };

  const handleOpenModal = () => {
    console.log("Öppnar popup");
    setModalVisible(true);
  };
  
  const handleCloseModal = () => {
    console.log("Stänger popup");
    setModalVisible(false);
  };

  const playSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('./assets/success.mp3')
    );
    setSound(sound);
    await sound.playAsync(); 
  }

  useEffect(() => {
    console.log('Popupens synlighet:', modalVisible);
  }, [modalVisible]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const triggerVibration = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

// Hämtar streakhistorik från AsyncStorage
const getStreakHistory = async () => {
  try {
    const history = await AsyncStorage.getItem('streakHistory');
    return history ? JSON.parse(history) : []; // Om ingen historik finns, returnera en tom lista
  } catch (error) {
    console.error("Error fetching streak history:", error);
    return [];
  }
};

// Sparar streakhistorik i AsyncStorage
const saveStreakHistory = async (history) => {
  try {
    await AsyncStorage.setItem('streakHistory', JSON.stringify(history));
    console.log("Streak history saved:", history);
  } catch (error) {
    console.error("Error saving streak history:", error);
  }
};

// Lägg till en ny streak i historiken
const addStreakToHistory = async (newStreak) => {
  try {
    const history = await getStreakHistory();
    const updatedHistory = [...history, newStreak];
    await saveStreakHistory(updatedHistory);

    // Kontrollera om den nya streaken är den längsta
    if (newStreak.length > bestStreak) {
      setBestStreak(newStreak.length);
      await saveSetting('bestStreak', newStreak.length);
    }

    console.log("Streak added to history:", newStreak);
    loadStreakHistory(); // Uppdatera historiken
  } catch (error) {
    console.error("Error adding streak to history:", error);
  }
};

const removeStreak = async (id) => {
  try {
    const history = await getStreakHistory();
    const updatedHistory = history.filter((streak) => streak.id !== id); // Behåll bara streaks som inte matchar id
    await saveStreakHistory(updatedHistory);
    setStreakHistory(updatedHistory); // Uppdatera state
    console.log(`Streak med ID ${id} togs bort.`);
  } catch (error) {
    console.error("Error removing streak:", error);
  }
};

const editStreak = async (id, updatedStreak) => {
  try {
    const history = await getStreakHistory();
    const updatedHistory = history.map((streak) =>
      streak.id === id ? { ...streak, ...updatedStreak } : streak
    );
    await saveStreakHistory(updatedHistory);
    setStreakHistory(updatedHistory); // Uppdatera state
    console.log(`Streak med ID ${id} har uppdaterats.`);
  } catch (error) {
    console.error("Error editing streak:", error);
  }
};
  

  const streakRef = useRef(null);

  const activityDuration = {
    run: 'minst 1.61 km',
    walk: 'minst 1.61 km',
    cycling: 'minst 20 minuter',
    workout: 'minst 20 minuter'
  };

  const changeBackground = async (background) => {
    try {
      await AsyncStorage.setItem('backgroundImage', background);
      switch (background) {
        case 'grass':
          setBackgroundImage(grassBackground);
          break;
        case 'dark':
          setBackgroundImage(darkBackground);
          break;
        case 'olive':
          setBackgroundImage(oliveBackground);
          break;
        case 'cloud':
          setBackgroundImage(cloudBackground);
          break;

        default:
          setBackgroundImage(grassBackground);
      }


    } catch (e) {
      console.error('Failed to save background setting.', e);
    }
  };
  
  

  const testImmediateNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Testnotis",
        body: "Detta är en testnotis för att kontrollera om notiser fungerar.",
      },
      trigger: {
        seconds: 10, // Notis kommer efter 10 sekunder
      },
    });
    console.log("Test notification scheduled.");
  };
  

  const showRetroactiveDatePicker = () => {
    setRetroactiveDatePickerVisibility(true);
  };
  
  const hideRetroactiveDatePicker = () => {
    setRetroactiveDatePickerVisibility(false);
  };
  
  const handleRetroactiveDateConfirm = (date) => {
    setRetroactiveDate(date);
    hideRetroactiveDatePicker();
  };
  
  const showNotificationDatePicker = () => {
    const currentTime = new Date();
    setTempNotificationTime(currentTime);
    setNotificationDatePickerVisibility(true);
  };
  
  const hideNotificationDatePicker = () => {
    setNotificationDatePickerVisibility(false);
  };
  
  const handleNotificationDateConfirm = async (date) => {
    setTempNotificationTime(date);
    setNotificationTime(date); // Uppdatera direkt den faktiska notificationTime
    hideNotificationDatePicker();
  
    // Spara den nya tiden och uppdatera notisschemaläggningen
    await saveSetting('notificationTime', date);
    if (notificationActive) {
      scheduleDailyNotification();
    }
  };
  
  

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
const resetstreakCount = async (isAutomatic = false) => {
  if (streakCount > bestStreak) {
    setBestStreak(streakCount);
    await saveSetting('bestStreak', streakCount);
  }

  // Lägg till den aktuella streaken i historiken
  if (streakCount > 0) {
    const completedStreak = {
      id: Date.now().toString(), // Unikt ID baserat på tid
      startDate: streakStartDate ? new Date(streakStartDate).toLocaleDateString('sv-SE') : 'Okänt',
      endDate: new Date().toLocaleDateString('sv-SE'),
      length: streakCount,
    };
    console.log("Sparar automatiskt streak i historik:", completedStreak);
    await addStreakToHistory(completedStreak);
    loadStreakHistory(); // Uppdaterar visningen
  }

  // Förhindra återställning om det inte är nödvändigt
  if (streakCount === 0) {
    console.log('Streak är redan 0, ingen återställning behövs.');
    return;
  }

  setStreakCount(0);
  setIsRunLoggedToday(false);

  setStreakStartDate(null); // eller new Date() om du föredrar att visa dagens datum tills en ny streak startar
  await saveSetting('streakStartDate', '');
  await saveSetting('streakCount', 0);
  await saveSetting('isRunLoggedToday', false);
  await saveSetting('runLoggedDate', '');

  if (isAutomatic) {
    setEncouragementVisible(true);
  } else {
    Alert.alert('Streak nollställd', 'Din streak har blivit nollställd.');
  }
};

  const handleEncouragementClose = async () => {
    setEncouragementVisible(false);
    setEncouragementShown(true);
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
  const resetBestStreak = async () => {
    const history = await getStreakHistory(); // Hämta historiken
    if (history.length > 0) {
      Alert.alert(
        'Längsta streak ej nollställd',
        'Du kan inte nollställa längsta streak så länge det finns sparad historik.'
      );
      return;
    }
  
    if (streakCount >= bestStreak) {
      Alert.alert(
        'Längsta streak ej nollställd',
        'Din längsta streak kan inte vara lägre än din nuvarande streak.'
      );
    } else {
      setBestStreak(streakCount);
      saveSetting('bestStreak', streakCount);
      Alert.alert(
        'Längsta streak nollställd',
        'Din längsta streak har blivit nollställd.'
      );
    }
  };

  const today = new Date();


  //Hantera loggning av 
  const handleLogRun = async (success) => {
    const todayDateString = new Date().toDateString('sv-SE');
  
    console.log('Dagens datum:', todayDateString);
    console.log('Är loggad idag:', isRunLoggedToday);

    if (success && !isRunLoggedToday) {
      if (streakCount >= 9999) {
        Alert.alert('Maximalt antal dagar uppnått', 'Du kan inte logga fler än 9999 dagar.');
        return;
      }
      const newStreakCount = streakCount + 1;
      setStreakCount(newStreakCount);
      setIsRunLoggedToday(true);
      await saveSetting('isRunLoggedToday', true);
      await saveSetting('runLoggedDate', todayDateString);
      await saveSetting('streakCount', newStreakCount);

      console.log('Aktivitet loggad idag:', isRunLoggedToday);
  
      if (newStreakCount > bestStreak) {
        setBestStreak(newStreakCount);
        await saveSetting('bestStreak', newStreakCount);
      }
  
      streakRef.current.rotate();
      await saveSetting('runLoggedDate', todayDateString);
      await saveSetting('streakCount', newStreakCount);
      setLogModalVisible(false);

         // Spela upp ljud
    playSound();

  // Trigger vibration
    triggerVibration();

if (streakCount === 0) {
  const todayDate = new Date();
  setStreakStartDate(todayDate);
  await saveSetting('streakStartDate', todayDate.toDateString());
}

    } else if (!success) {
      Alert.alert('Målet har inte uppnåtts', 'Kom ihåg att springa minst 1.61 km!');
      setLogModalVisible(false);
    } else {
      Alert.alert('Redan loggad', 'Du har redan loggat din aktivitet för idag.');
      setLogModalVisible(false);
    }

    await scheduleDailyNotification();

  };
  

  // Effekt-hook som körs när komponenten laddas
  useEffect(() => {
    registerForPushNotificationsAsync();
    loadSettings();
    setRandomQuote();
    checkDate();
  }, [activityMode]);

  useEffect(() => {
    loadStreakHistory();
  }, []);

  useEffect(() => {
    console.log("Popupens synlighet ändrad: ", modalVisible);
  }, [modalVisible]);

  useEffect(() => {
    const checkForNewVersion = async () => {
      const isNewVersion = await checkAppVersion();
      if (isNewVersion) {
        // Visa popup med information om nya funktioner
        Alert.alert(
          'Ny Uppdatering!',
          'Här är de nya funktionerna i appen:\n\n' +
            '- Nytt historiksystem för streaks\n' +
            '- Förbättrad design\n' +
            '- Fler alternativ för aktiviteter\n' +
            '- Och mycket mer!',
          [{ text: 'OK', onPress: () => console.log('Popup visad för ny version') }]
        );
      }
    };
    checkForNewVersion();
  }, []);

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

  const loadSettings = async () => {
    try {
      const encouragementShown = await AsyncStorage.getItem('encouragementShown');
      setEncouragementShown(encouragementShown === 'true');
      console.log('encouragementShown:', encouragementShown);
  
      const timeString = await AsyncStorage.getItem('notificationTime');
      if (timeString !== null) {
        const savedTime = new Date(timeString);
        setNotificationTime(savedTime);
        setTempNotificationTime(savedTime);
        setNotificationActive(true);
      }
      console.log('notificationTime:', timeString);
  
      const savedNotificationActive = await AsyncStorage.getItem('notificationActive');
      if (savedNotificationActive !== null) {
        const isActive = savedNotificationActive === 'true';
        setNotificationActive(isActive);
        if (isActive) {
          await scheduleDailyNotification(); // Schemalägg notiser om de är aktiva
        }
      }
      console.log('notificationActive:', savedNotificationActive);

          // Om notiser är aktiva, schemalägg dem
    if (savedNotificationActive === 'true') {
      scheduleDailyNotification();
    }
  
      const theme = await AsyncStorage.getItem('darkTheme');
      setDarkTheme(theme === 'true');
      console.log('darkTheme:', theme);

      const savedStreakStartDate = await AsyncStorage.getItem('streakStartDate');
      
      if (savedStreakStartDate !== null) {
        setStreakStartDate(new Date(savedStreakStartDate));
         } else {
        setStreakStartDate(null); // Sätt till null om ingen startdatum finns
      }
  
      const totalDistance = await AsyncStorage.getItem('showTotalDistance');
      setShowTotalDistance(totalDistance !== 'false');
      console.log('showTotalDistance:', totalDistance);
  
      const motivationalQuote = await AsyncStorage.getItem('showMotivationalQuote');
      setShowMotivationalQuote(motivationalQuote !== 'false');
      console.log('showMotivationalQuote:', motivationalQuote);
  
      const bestStreakString = await AsyncStorage.getItem('bestStreak');
      if (bestStreakString !== null) {
        setBestStreak(parseInt(bestStreakString));
      }
      console.log('bestStreak:', bestStreakString);
  
      const showBestStreakString = await AsyncStorage.getItem('showBestStreak');
      setShowBestStreak(showBestStreakString !== 'false');
      console.log('showBestStreak:', showBestStreakString);
  
      const showRetroactiveButtonString = await AsyncStorage.getItem('showRetroactiveButton');
      setShowRetroactiveButton(showRetroactiveButtonString !== 'false');
      console.log('showRetroactiveButton:', showRetroactiveButtonString);

      const showShareButtonString = await AsyncStorage.getItem('showShareButton');
    setShowShareButton(showShareButtonString !== 'false');
    console.log('showShareButton:', showShareButtonString);
  
      const savedLastCheckedDate = await AsyncStorage.getItem('lastCheckedDate');
      if (savedLastCheckedDate !== null) {
        setLastCheckedDate(savedLastCheckedDate);
      }
      console.log('lastCheckedDate:', savedLastCheckedDate);
  
 const savedRunLoggedDate = await AsyncStorage.getItem('runLoggedDate');
      const todayDateString = new Date().toDateString('sv-SE');
      const savedRunLoggedDateString = savedRunLoggedDate ? new Date(savedRunLoggedDate).toLocaleDateString('sv-SE') : null;
      if (savedRunLoggedDateString !== null && savedRunLoggedDateString === todayDateString) {
        setIsRunLoggedToday(true);
        await saveSetting('isRunLoggedToday', true);
        console.log(`loadSettings - Run logged today: ${savedRunLoggedDateString}`);
    }
    
  
      const savedStreakCount = await AsyncStorage.getItem('streakCount');
      if (savedStreakCount !== null) {
        setStreakCount(parseInt(savedStreakCount));
      } else {
        setStreakCount(0);
        saveSetting('streakCount', 0);
      }
      console.log('streakCount:', savedStreakCount);
  
      const savedActivityMode = await AsyncStorage.getItem('activityMode');
      if (savedActivityMode !== null) {
        setActivityMode(savedActivityMode);
      }
      console.log('activityMode:', savedActivityMode);
  
      const savedShowFullDate = await AsyncStorage.getItem('showFullDate');
      if (savedShowFullDate !== null) {
        setShowFullDate(savedShowFullDate === 'true');
      }
      console.log('showFullDate:', savedShowFullDate);
  
      const savedIsRunLoggedToday = await AsyncStorage.getItem('isRunLoggedToday');
      if (savedIsRunLoggedToday !== null) {
        setIsRunLoggedToday(savedIsRunLoggedToday === 'true');
      } else {
        setIsRunLoggedToday(false);
      }
      console.log('isRunLoggedToday:', savedIsRunLoggedToday);
  
      const savedRetroactiveDate = await AsyncStorage.getItem('retroactiveDate');
      if (savedRetroactiveDate !== null) {
        setRetroactiveDate(new Date(savedRetroactiveDate));
      }
      console.log('retroactiveDate:', savedRetroactiveDate);
  
      const savedBackgroundImage = await AsyncStorage.getItem('backgroundImage');
      if (savedBackgroundImage) {
        switch (savedBackgroundImage) {
          case 'grass':
            setBackgroundImage(grassBackground);
            break;
          case 'dark':
            setBackgroundImage(darkBackground);
            break;
          case 'olive':
            setBackgroundImage(oliveBackground);
            break;
          case 'cloud':
            setBackgroundImage(cloudBackground);
            break;
          default:
            setBackgroundImage(grassBackground);
        }
      }

      await loadStreakHistory();

    } catch (e) {
      console.error('Failed to load settings.', e);
    }
  };
  
  

  // Spara inställningar i AsyncStorage
  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
      console.log(`Saved setting ${key} with value ${value}`);
    } catch (e) {
      console.error(`Failed to save setting ${key}.`, e);
    }
  };
  

  // Sätt ett slumpmässigt citat baserat på aktivitetstyp
  const setRandomQuote = () => {
    let quotes;
    switch (activityMode) {
      case 'run':
        quotes = runningQuotes;
        break;
      case 'walk':
        quotes = walkingQuotes;
        break;
      case 'cycling':
        quotes = cyclingQuotes;
        break;
      case 'workout':
        quotes = workoutQuotes;
        break;
      default:
        quotes = runningQuotes;
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setMotivationalQuote(quotes[randomIndex]);
  };
  

  // Schemalägg dagliga notiser
  const scheduleDailyNotification = async () => {
    console.log("Scheduling daily notification. Notification active:", notificationActive);
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All notifications canceled.");
  
    if (!notificationActive) {
      console.log("Notifications are not active. Exiting schedule function.");
      return;
    }
  
    const trigger = new Date(notificationTime);
    trigger.setDate(new Date().getDate());
    if (trigger < new Date()) {
      trigger.setDate(trigger.getDate() + 1);
    }
  
    console.log(`Scheduling notification for ${trigger.getHours()}:${trigger.getMinutes()}`);
  
    const isActivityLogged = (await AsyncStorage.getItem('isRunLoggedToday') || 'false') === 'true';
const notificationContent = isActivityLogged
    ? { title: 'Bra jobbat!', body: 'Du har redan loggat din aktivitet för idag. Fortsätt så!' }
    : { title: 'Daglig påminnelse', body: 'Glöm inte att logga din streak i appen!' };

    console.log(`Scheduling notification for ${trigger.getHours()}:${trigger.getMinutes()}`);

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: {
        hour: trigger.getHours(),
        minute: trigger.getMinutes(),
        repeats: true,
      },
    });
  
    console.log("Notification scheduled.");
  };
  
  
  

  // Schemalägg notis för streak
  const scheduleStreakNotification = async (streak) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Grattis!',
        body: `Du har uppnått din dagliga målsättning med ${streak} dagars ${activityMode === 'run' ? 'löpstreak' : activityMode === 'walk' ? 'promenadstreak' : activityMode === 'cycling' ? 'cykelstreak' : 'träningsstreak'}!`,
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
    console.log("Tid bekräftad:", tempNotificationTime);
    setNotificationTime(tempNotificationTime);
    setNotificationActive(true);
    saveSetting('notificationTime', tempNotificationTime);
    saveSetting('notificationActive', true);
    scheduleDailyNotification();
    setSettingsVisible(true);
    handleCloseModal();
  };

  // Avbryt tidändring för notiser
  const cancelTime = () => {
    setSettingsVisible(true);
    handleCloseModal();
  };

  // Växla notisstatus
  const toggleNotification = async () => {
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) return;
  
    const newNotificationState = !notificationActive;
    setNotificationActive(newNotificationState);
    await saveSetting('notificationActive', newNotificationState);
  
    if (newNotificationState) {
      await scheduleDailyNotification();
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };
  
  // Lägg till useEffect för att schemalägga dagliga notiser när notificationActive ändras
  useEffect(() => {
    if (notificationActive) {
      console.log("Scheduling daily notification. Notification active:", notificationActive);
      scheduleDailyNotification();
    }
  }, [notificationActive]);
  
  
  

  // Kontrollera datum för att återställa streak vid behov
  const checkDate = async () => {
    const currentDate = new Date().toDateString();
    const savedRunLoggedDate = await AsyncStorage.getItem('runLoggedDate');
    const encouragementShown = await AsyncStorage.getItem('encouragementShown');
  
    console.log('Kontrollerar datum:', currentDate);
    console.log('Senast loggad datum:', savedRunLoggedDate);
    
    if (savedRunLoggedDate !== null) {
      const lastRunDate = new Date(savedRunLoggedDate);
      const dayDifference = Math.floor((new Date().getTime() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDifference > 1) {
        await resetstreakCount(true); // Sätter isAutomatic till true
        if (encouragementShown !== 'true') {
          setEncouragementVisible(true);
          await AsyncStorage.setItem('encouragementShown', 'true');
        }
      }
    }
  
    if (currentDate !== lastCheckedDate) {
      setLastCheckedDate(currentDate);
      await saveSetting('lastCheckedDate', currentDate);
    }
    
    if (savedRunLoggedDate === currentDate) {
      setIsRunLoggedToday(true);
      await saveSetting('isRunLoggedToday', true);
      console.log('isRunLoggedToday:', true);
    } else {
      setIsRunLoggedToday(false);
      await saveSetting('isRunLoggedToday', false);
      console.log('isRunLoggedToday:', false);
    }
    
    const allowLog = !isRunLoggedToday;
    setAllowLogToday(allowLog);
    console.log('allowLogToday:', allowLog);
  
    await scheduleDailyNotification();
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
    const activityType =
      activityMode === 'run'
        ? 'löpstreak'
        : activityMode === 'walk'
        ? 'promenadstreak'
        : activityMode === 'cycling'
        ? 'cykelstreak'
        : 'träningsstreak';

    const result = await Share.share({
      message: `Jag har ${streakCount} dagars ${activityType}! #MoveStreakApp`,
    });
  } catch (error) {
    alert(error.message);
  }
};

  // Sätt retroaktiv streak
  const setRetroactiveStreak = async () => {
    const currentDate = new Date();
    const selectedDate = new Date(retroactiveDate);
    let daysSinceStart;
    
    if (selectedDate.toDateString() === currentDate.toDateString()) {
      daysSinceStart = 1;
      setIsRunLoggedToday(true);
      await saveSetting('runLoggedDate', currentDate.toDateString());
    } else {
      daysSinceStart = Math.floor((currentDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  
    if (daysSinceStart > 9999) {
      Alert.alert('Maximalt antal dagar uppnått', 'Du kan inte logga fler än 9999 dagar.');
      return;
    }
  
    const wasRunLoggedToday = isRunLoggedToday;
  
    setStreakCount(daysSinceStart);
    await saveSetting('streakCount', daysSinceStart);
    await saveSetting('retroactiveDate', selectedDate.toDateString());
    setRetroactiveModalVisible(false);
  
    if (daysSinceStart > bestStreak) {
      setBestStreak(daysSinceStart);
      await saveSetting('bestStreak', daysSinceStart);
    }
  
    if (wasRunLoggedToday) {
      const updatedStreakCount = daysSinceStart + 1;
      setStreakCount(updatedStreakCount);
      await saveSetting('streakCount', updatedStreakCount);
  
      if (updatedStreakCount > bestStreak) {
        setBestStreak(updatedStreakCount);
        await saveSetting('bestStreak', updatedStreakCount);
      }
      setIsRunLoggedToday(true);
      await saveSetting('runLoggedDate', currentDate.toDateString());
    } else {
      setIsRunLoggedToday(false);
      await saveSetting('isRunLoggedToday', false);
    }
  
    setStreakStartDate(selectedDate);
    await saveSetting('streakStartDate', selectedDate.toDateString());

    setAllowLogToday(true);
  };
  
  

  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.backgroundImage}
    >
      <View style={[styles.container, darkTheme && styles.darkContainer]}>
        <View style={[styles.header, darkTheme && styles.darkHeaderFooter]}>
          <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.menuIcon}>
            <Icon name="bars" size={30} color={darkTheme ? "#fff" : "#3E4A89"} />
          </TouchableOpacity>
          <Text style={[styles.title, darkTheme && styles.darkHeaderFooterText]}>
            MoveStreak <Icon name="angle-up" size={30} color={darkTheme ? "#fff" : "#3E4A89"} />
          </Text>
        </View>
        <View style={styles.content}>
          

<Animatable.View ref={streakRef} animation="bounceIn" duration={1000} style={[ styles.streakContainer, 
    darkTheme && styles.darkCard,
    isRunLoggedToday ? styles.loggedBorder : styles.notLoggedBorder]}>
        <Text style={[styles.streakStartDate, darkTheme && styles.darkText]}>
        Start: {streakStartDate ? new Date(streakStartDate).toLocaleDateString('sv-SE') : new Date().toLocaleDateString('sv-SE')}
  </Text>
  {showFullDate ? (
    (() => {
      const { years, months, days } = calculateDateDifference(new Date().setDate(new Date().getDate() - streakCount), new Date());
      return (
        <View style={styles.fullDateContainer}>
          {years > 0 && (
            <Text style={[styles.streakText, darkTheme && styles.darkText, { fontSize: 40 }]}>
              {years} år
            </Text>
          )}
          {months > 0 && (
            <Text style={[styles.streakText, darkTheme && styles.darkText, { fontSize: 40 }]}>
              {months} månader
            </Text>
          )}
          {days > 0 && (
            <Text style={[styles.streakText, darkTheme && styles.darkText, { fontSize: 40 }]}>
              {days} dagar
            </Text>
          )}
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
                <TouchableOpacity
  style={[styles.button, styles.buttonConfirm]}
  onPress={showRetroactiveDatePicker}
>
  <Text style={styles.textStyle}>Välj datum</Text>
</TouchableOpacity>
<DateTimePickerModal
  isVisible={isRetroactiveDatePickerVisible}
  mode="date"
  onConfirm={handleRetroactiveDateConfirm}
  onCancel={hideRetroactiveDatePicker}
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
  onRequestClose={() => setEncouragementVisible(false)}
>
  <View style={styles.centeredView}>
    <View style={[styles.modalView, darkTheme && styles.darkModalView]}>
      <Text style={[styles.modalText, darkTheme && styles.darkText]}>Din streak har återställts</Text>
      <Text style={[styles.modalText, darkTheme && styles.darkText]}>
        Det är okej att ha en dålig dag. Ta nya tag och börja om på din streak! Vi tror på dig!
      </Text>
      <TouchableOpacity
        style={[styles.button, styles.buttonConfirm]}
        onPress={() => setEncouragementVisible(false)}
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
                <Text style={[styles.modalText, darkTheme && styles.darkText]}>Har du {activityMode === 'run' ? 'sprungit' : activityMode === 'walk' ? 'gått' : activityMode === 'cycling' ? 'cyklat' : 'tränat'} {activityDuration[activityMode]} idag?</Text>
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
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>Välj bakgrund</Text>
        <View style={styles.backgroundButtonContainer}>
          <TouchableOpacity onPress={() => changeBackground('grass')}>
            <Text style={styles.backgroundButton}>Ljus</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeBackground('dark')}>
            <Text style={styles.backgroundButton}>Mörk</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeBackground('olive')}>
            <Text style={styles.backgroundButton}>Ljusblå</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeBackground('cloud')}>
            <Text style={styles.backgroundButton}>Moln</Text>

          </TouchableOpacity>
        </View>
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
    handleOpenModal();
  }}
  containerStyle={styles.smallButtonContainer}
/>


</View>

<View style={styles.activityModeContainer}>
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>Aktivitetsläge</Text>
        <View style={styles.activityButtonsContainer}>
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
          <TouchableOpacity
            onPress={() => {
              setActivityMode('cycling');
              saveSetting('activityMode', 'cycling');
            }}
            style={activityMode === 'cycling' ? styles.activeActivityButtonContainer : styles.inactiveActivityButtonContainer}
          >
            <Text style={[styles.activityButtonText, darkTheme && styles.darkActivityButtonText]}>Cykling</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActivityMode('workout');
              saveSetting('activityMode', 'workout');
            }}
            style={activityMode === 'workout' ? styles.activeActivityButtonContainer : styles.inactiveActivityButtonContainer}
          >
            <Text style={[styles.activityButtonText, darkTheme && styles.darkActivityButtonText]}>Träning</Text>
          </TouchableOpacity>
        </View>
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
            onRequestClose={handleCloseModal}
          >
            <View style={styles.centeredView}>
              <View style={[styles.modalView, darkTheme && styles.darkModalView]}>
                <Text style={[styles.modalText, darkTheme && styles.darkText]}>Välj tid</Text>
                <TouchableOpacity
  style={[styles.button, styles.buttonConfirm]}
  onPress={showNotificationDatePicker}
>
  <Text style={styles.textStyle}>Välj tid</Text>
</TouchableOpacity>
<DateTimePickerModal
  isVisible={isNotificationDatePickerVisible}
  mode="time"
  onConfirm={handleNotificationDateConfirm}
  onCancel={hideNotificationDatePicker}
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
        </View>
        <View style={[styles.footer, darkTheme && styles.darkHeaderFooter]}>
          <Text style={[styles.copyright, darkTheme && styles.darkHeaderFooterText]}>© Andreas Selin 2024</Text>
        </View>
      </View>

      <TouchableOpacity
  style={{
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3E4A89',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  }}
  onPress={() => setHistoryModalVisible(true)}
>
  <Icon name="history" size={30} color="#FFF" />
</TouchableOpacity>

<Modal
  animationType="slide"
  transparent={true}
  visible={historyModalVisible}
  onRequestClose={() => setHistoryModalVisible(false)}
>
  <View style={styles.centeredView}>
    <View style={[styles.modalView, darkTheme && styles.darkModalView]}>
    <Text style={[styles.historyHeader, darkTheme && styles.darkText]}>Din Streak-historik</Text>

    <FlatList
  data={streakHistory}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => {
    const startDate = new Date(item.startDate).toLocaleDateString('sv-SE');
    const endDate = new Date(item.endDate).toLocaleDateString('sv-SE');
    const lengthInDays = Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) + 1;

    return (
      <View style={styles.historyCard}>
        <View style={styles.dateContainer}>
          <Text style={styles.historyDateText}>{startDate} → {endDate}</Text>
          <View style={styles.dayCountContainer}>
            <Text style={styles.dayCountText}>{lengthInDays} dagar</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.historyDeleteButton}
          onPress={() => removeStreak(item.id)}
        >
          <Text style={styles.historyDeleteButtonText}>Ta bort</Text>
        </TouchableOpacity>
      </View>
    );
  }}
  contentContainerStyle={{ paddingVertical: 20 }}
  showsVerticalScrollIndicator={false}
  ListEmptyComponent={() => (
    <View style={styles.emptyContainer}>
      <Icon name="history" size={50} color="#ccc" />
      <Text style={styles.emptyText}>Ingen historik än. Logga en streak för att komma igång!</Text>
    </View>
  )}
/>

<Modal
  animationType="slide"
  transparent={true}
  visible={addModalVisible}
  onRequestClose={() => setAddModalVisible(false)}
>
  <View style={styles.centeredView}>
    <View style={[styles.modalView, darkTheme && styles.darkModalView]}>
      <Text style={[styles.modalText, darkTheme && styles.darkText]}>Lägg till en streak</Text>
      
      <Text style={{ marginBottom: 10, fontWeight: 'bold', color: darkTheme ? '#fff' : '#000' }}>Startdatum:</Text>
      <TouchableOpacity
  style={{ padding: 10, backgroundColor: '#ddd', borderRadius: 5, marginBottom: 10 }}
  onPress={() => setStartDatePickerVisible(true)}
>
  <Text style={{ color: '#333', fontSize: 16 }}>
    Startdatum: {newStartDate ? new Date(newStartDate).toLocaleDateString('sv-SE') : 'Välj datum'}
  </Text>
</TouchableOpacity>

<DateTimePickerModal
  isVisible={isStartDatePickerVisible}
  mode="date"
  onConfirm={(date) => {
    setNewStartDate(date);
    setStartDatePickerVisible(false);
  }}
  onCancel={() => setStartDatePickerVisible(false)}
/>

<TouchableOpacity
  style={{ padding: 10, backgroundColor: '#ddd', borderRadius: 5, marginBottom: 10 }}
  onPress={() => setEndDatePickerVisible(true)}
>
  <Text style={{ color: '#333', fontSize: 16 }}>
    Slutdatum: {newEndDate ? new Date(newEndDate).toLocaleDateString('sv-SE') : 'Välj datum'}
  </Text>
</TouchableOpacity>

<DateTimePickerModal
  isVisible={isEndDatePickerVisible}
  mode="date"
  onConfirm={(date) => {
    setNewEndDate(date);
    setEndDatePickerVisible(false);
  }}
  onCancel={() => setEndDatePickerVisible(false)}
/>

      <TouchableOpacity
        style={[styles.button, styles.buttonConfirm]}
        onPress={async () => {
          const diffInMs = new Date(newEndDate) - new Date(newStartDate);
          const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + 1;
          await addStreakToHistory({
            id: Date.now().toString(),
            startDate: newStartDate.toDateString(),
            endDate: newEndDate.toDateString(),
            length: days,
          });
          setAddModalVisible(false);
          loadStreakHistory();
        }}
      >
        <Text style={styles.textStyle}>Lägg till</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonCancel]}
        onPress={() => setAddModalVisible(false)}
      >
        <Text style={styles.textStyle}>Avbryt</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

<TouchableOpacity
  style={{ padding: 10, backgroundColor: '#28a745', borderRadius: 5, marginBottom: 10, alignSelf: 'center' }}
  onPress={() => setAddModalVisible(true)}
>
  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Lägg till</Text>
</TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.buttonCancel]}
        onPress={() => setHistoryModalVisible(false)}
      >
        <Text style={styles.textStyle}>Stäng</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
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
    marginVertical: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1%'),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: wp('2%'),
  },

  historyCard: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
    width: '90%',
    alignSelf: 'center',
  },
  historyInfo: {
    flex: 1,
  },

  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },

dayCountContainer: { 
  backgroundColor: '#FFD700', // Gul bakgrund för rutan
  borderRadius: 5, // Rundade hörn
  paddingVertical: 5,
  paddingHorizontal: 10,
  marginLeft: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 2,
},
dayCountText: {
  color: '#000', // Svart text
  fontWeight: 'bold',
  fontSize: 14,
},

  historyDateText: {
    fontSize: 16,
    color: '#3E4A89',
    textAlign: 'center',
  },
  historyLengthText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  historyDeleteButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: '#f44336',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  historyDeleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  backgroundButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: hp('1%'),
  },
  backgroundButton: {
    marginHorizontal: wp('1%'),
    padding: wp('2%'),
    backgroundColor: '#ddd',
    borderRadius: wp('2%'),
    textAlign: 'center',
  },

  celebrationText: {
    fontSize: wp('7%'),
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: hp('1%'),
  },
  motivationalText: {
    fontSize: wp('4.5%'),
    fontStyle: 'italic',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: wp('-0.3%'), height: hp('0.3%') },
    textShadowRadius: wp('2%'),
    padding: wp('0%'),
  },

  streakStartDate: {
    fontSize: wp('2.5%'),
    color: '#3E4A89',
    position: 'absolute',
    top: hp('3%'),
    textAlign: 'center',
  },
  darkText: {
    color: '#FFF',
  },
  

  activityModeContainer: {
    marginVertical: hp('2%'),
    alignItems: 'center',
  },
  activityButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },

  activeActivityButtonContainer: {
    borderWidth: wp('0.75%'),
    borderColor: '#28a745',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.6%'),
    marginHorizontal: wp('1.25%'),
    marginVertical: hp('0.5%'),
    alignItems: 'center',
  },
  inactiveActivityButtonContainer: {
    borderWidth: wp('0.5%'),
    borderColor: '#ddd',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.6%'),
    marginHorizontal: wp('1.25%'),
    marginVertical: hp('0.5%'),
    alignItems: 'center',
  },
  activityButtonText: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  darkActivityButtonText: {
    color: '#FFF', // Vit text för dark mode
  },

  moveStreakText: {
    fontSize: wp('3%'),
    position: 'absolute',
    bottom: hp('1%'),
    left: wp('21%'),
    fontSize: wp('3%'),
    color: '#777',
    textAlign: 'center',
    alignSelf: 'center',
    opacity: 0.7,
  }
  ,
  darkMoveStreakText: {
    color: '#BBB', // Diskret färg för mörkt tema
    fontSize: wp('3%'),
    position: 'absolute',
    bottom: hp('1%'),
    left: wp('21%'),
    fontSize: wp('3%'),
    textAlign: 'center',
    alignSelf: 'center',
    opacity: 0.7,
  },

  historyHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E4A89',
    marginBottom: 10,
    textAlign: 'center',
  },

  streakContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffdbd',
    borderRadius: wp('40%'),
    width: wp('60%'),
    height: wp('60%'),
    marginVertical: hp('2%'),
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.8,
    shadowRadius: wp('2%'),
    elevation: 5,
    borderWidth: wp('1.3%'),
    borderColor: '#FFD700',
  },

  loggedBorder: {
    borderWidth: wp('1.3%'),
    borderColor: '#28a745', // Grön färg när loggad
  },
  notLoggedBorder: {
    borderWidth: wp('1.3%'),
    borderColor: '#FFD700', // Gul färg när inte loggad
  },

  streakText: {
    fontSize: wp('15%'), // Anpassa storleken efter skärmbredden
    fontWeight: 'bold',
    color: '#3E4A89',
    textAlign: 'center', // Se till att texten centreras
  },
  logButton: {
    backgroundColor: '#fffdbd',
    borderRadius: wp('7%'),
    paddingHorizontal: wp('12.5%'),
    paddingVertical: hp('2.5%'),
    marginTop: hp('2%'),
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.8,
    shadowRadius: wp('2%'),
    elevation: 5,
    borderWidth: wp('0.5%'),
    borderColor: '#ddd',
  },
  logButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: wp('6%'),
    textAlign: 'center',
  },
  darkLogButtonText: {
    color: '#FFF', // Vit text för dark mode
  },
  activeActivityButtonContainer: {
    borderWidth: wp('0.75%'),
    borderColor: '#28a745',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.6%'),
    marginHorizontal: wp('1.25%'),
    alignItems: 'center',
  },
  inactiveActivityButtonContainer: {
    borderWidth: wp('0.5%'),
    borderColor: '#ddd',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.6%'),
    marginHorizontal: wp('1.25%'),
    alignItems: 'center',
  },
  activityButtonText: {
    fontSize: wp('4%'),
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
    marginTop: hp('1%'),
  },
  smallButton: {
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.6%'),
  },
  smallButtonContainer: {
    flex: 1,
    marginHorizontal: wp('1.25%'),
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  inactiveButton: {
    backgroundColor: '#f44336', // Röd färg för inaktiverad knapp
  },
  container: {
    flex: 1,
    backgroundImage: 'url(./assets/grass_background.png)',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    padding: wp('0%'),
  },
  darkContainer: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: wp('2.5%'),
    paddingTop: hp('6.25%'),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  footerContainer: {
    position: 'absolute',
    bottom: hp('1.25%'),
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
    fontSize: wp('7%'),
    fontWeight: 'bold',
    color: '#3E4A89',
  },
  darkTitle: {
    color: '#fff',
  },
  menuIcon: {
    padding: wp('2.5%'),
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('2.5%'),
  },
  bestStreakCard: {
    position: 'absolute',
    top: hp('1.5%'),
    right: wp('2.5%'),
    width: wp('35%'),
    height: hp('9.25%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#3E4A89',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.8,
    shadowRadius: wp('2%'),
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('2.5%'),
  },
  darkBestStreakCard: {
    position: 'absolute',
    top: hp('1.5%'),
    right: wp('2.5%'),
    width: wp('35%'),
    height: hp('9.25%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#1f1f1f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.8,
    shadowRadius: wp('2%'),
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('2%'),
  },
  bestStreakLabel: {
    fontSize: wp('4%'),
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: hp('0.5%'),
  },
  bestStreakCount: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#2E7D32', // Ändra denna rad
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: wp('-0.3%'), height: hp('0.3%') },
    textShadowRadius: wp('2%'),
  },
  darkBestStreakLabel: {
    fontSize: wp('4%'),
    color: '#FFF',
    textAlign: 'center',
    marginBottom: hp('0.1%'),
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: wp('-0.3%'), height: hp('0.3%') },
    textShadowRadius: wp('2%'),
  },
  darkBestStreakCount: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: wp('-0.3%'), height: hp('0.3%') },
    textShadowRadius: wp('2%'),
  },
  streakCard: {
    width: '100%',
    borderRadius: wp('12.5%'),
    padding: wp('5%'),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.8,
    shadowRadius: wp('2%'),
    elevation: 1,
    marginBottom: hp('2%'),
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
    fontSize: wp('5%'),
    color: '#fff',
    marginBottom: hp('1%'),
  },
  streakCount: {
    fontSize: wp('15%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  bestStreakLabel: {
    fontSize: wp('4%'),
    color: '#fff',
  },
  bestStreakCount: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  dailyGoalLabel: {
    fontSize: wp('4%'),
    color: '#fff',
  },
  dailyGoalIcon: {
    fontSize: wp('5%'),
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
    borderRadius: wp('2.5%'),
    padding: wp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderRadius: wp('2.5%'),
    padding: wp('3.75%'),
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.8,
    shadowRadius: wp('2%'),
    elevation: 1,
    marginBottom: hp('2%'),
  },
  closeButtonWrapper: {
    position: 'absolute',
    top: hp('1.5%'),
    right: wp('2.5%'),
    backgroundColor: '#ee5612',
    borderRadius: wp('5%'),
    width: wp('6.25%'),
    height: wp('6.25%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.8,
    shadowRadius: wp('2%'),
    elevation: 5,
  },
  buttonClose: {
    backgroundColor: '#ee5612',
  },
  darkText: {
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: wp('-0.3%'), height: hp('0.3%') },
    textShadowRadius: wp('2%'),
    padding: 0,
  },
  label: {
    fontSize: wp('4.5%'),
    color: '#3E4A89',
    marginBottom: hp('1%'),
  },
  button: {
    backgroundColor: '#3E4A89',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('1.25%'),
    flexShrink: 1,
  },
  buttonContainer: {
    width: '50%',
    marginTop: hp('2%'),
  },
  buttonReset: {
    backgroundColor: '#ff6f61',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.25%'),
    marginTop: hp('2%'),
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.8,
    shadowRadius: wp('2%'),
    elevation: 5,
    borderWidth: wp('0.25%'),
    borderColor: '#ddd',
  },
  textReset: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: wp('4%'),
    textAlign: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  modalView: {
    zIndex: 9999,
    margin: wp('2.5%'),
    backgroundColor: 'white',
    borderRadius: wp('5%'),
    padding: wp('5%'),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: hp('0.3%')
    },
    shadowOpacity: 0.25,
    shadowRadius: wp('2%'),
    elevation: 5,
  },
  darkModalView: {
    backgroundColor: '#333',
    borderRadius: wp('5%'),
    padding: wp('5%'),
  },
  buttonConfirm: {
    backgroundColor: '#28A745',
    marginTop: hp('1%'),
  },
  buttonCancel: {
    backgroundColor: '#ee5612',
    marginTop: hp('1%'),
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: wp('2.5%'),
    flexShrink: 1,
  },
  modalText: {
    marginBottom: hp('1.5%'),
    textAlign: 'center',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    flexShrink: 1,
  },
  dateTimePicker: {
    width: '100%',
    height: hp('18.75%'),
  },
  notificationInfoContainer: {
    marginTop: hp('2%'),
    alignItems: 'center',
    padding: wp('2.5%'),
    backgroundColor: '#f9f9f9',
    borderRadius: wp('2.5%'),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.1,
    shadowRadius: wp('2%'),
    elevation: 1,
  },
  notificationInfoText: {
    fontSize: wp('4%'),
    color: '#3E4A89',
    marginBottom: hp('1%'),
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: hp('1%'),
    marginVertical: hp('0.75%'),
    flexWrap: 'wrap',
  },
  modalLabel: {
    marginBottom: hp('2.5%'),
    textAlign: 'center',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  syncButton: {
    backgroundColor: '#fffdbd',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.25%'),
    marginTop: hp('2%'),
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.8,
    shadowRadius: wp('2%'),
    elevation: 5,
    borderWidth: wp('0.25%'),
    borderColor: '#ddd',
  },
  darkSyncButton: {
    backgroundColor: '#1f1f1f',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.25%'),
    marginTop: hp('2%'),
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.8,
    shadowRadius: wp('2%'),
    elevation: 5,
    borderWidth: wp('0.25%'),
    borderColor: '#555',
  },
  darkSyncButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: wp('3.5%'),
    textAlign: 'center',
  },
  moveDownButton: {
    marginTop: hp('1%'), // Tidigare 50
  }
  ,
  darkButton: {
    backgroundColor: '#1f1f1f',
    borderRadius: wp('7%'),
    paddingHorizontal: wp('10.5%'),
    paddingVertical: hp('2%'),
    marginTop: hp('2%'),
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.8,
    shadowRadius: wp('2%'),
    elevation: 5,
    borderWidth: wp('0.5%'),
    borderColor: '#555',
  },
  footer: {
    padding: wp('2.5%'),
    backgroundColor: '#E8EAF6',
    alignItems: 'center',
  },
  copyright: {
    fontSize: wp('3%'),
    color: '#3E4A89',
    textAlign: 'center',
  },
});