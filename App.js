import React, { useEffect, useState, useRef } from 'react';
import {
  AppState,
  Platform,
  StyleSheet,
  Text,
  View,
  Alert,
  FlatList,
  Animated,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Dimensions,
  Share,
  ImageBackground,
} from 'react-native';
import { Button } from 'react-native-elements';
import Icon from '@expo/vector-icons/FontAwesome';
import * as Animatable from 'react-native-animatable';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import grassBackground from './assets/grass_background.png';
import darkBackground from './assets/dark_background.png';
import oliveBackground from './assets/olive_background.png';
import cloudBackground from './assets/cloud_background.png';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import LogButton from './LogButton';
import { useTranslation } from 'react-i18next';
import i18n, { setAppLanguage, hydrateI18nLanguage } from './i18n';

/** Konsekvent dag-nyckel för AsyncStorage (oförändrad så befintliga användare inte tappar matchning). */
function storageDateKey(d = new Date()) {
  return new Date(d).toLocaleDateString('sv-SE');
}

function calculateDateDifference(startDate, endDate) {
  let start = new Date(startDate);
  let end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  console.log(`Beräknad skillnad: ${years} år, ${months} månader, ${days} dagar`);
  return { years, months, days };
}

let isSchedulingNotification = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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

// Huvudkomponenten för appen
export default function App() {
  const { t } = useTranslation();
  const localeTag = i18n.language.startsWith('sv') ? 'sv-SE' : 'en-US';

  const [encouragementVisible, setEncouragementVisible] = useState(false);
  const [encouragementShown, setEncouragementShown] = useState(false);
  const [dateDifference, setDateDifference] = useState({ years: 0, months: 0, days: 0 });
  const [streakCount, setStreakCount] = useState(0);
  const [lastCheckedDate, setLastCheckedDate] = useState(() => storageDateKey());
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

  const clearAsyncStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log('AsyncStorage rensat.');
      Alert.alert(t('alerts.clearTitle'), t('alerts.clearBody'));
    } catch (error) {
      console.error('Fel vid rensning av AsyncStorage:', error);
    }
  };
  
  const loadStreakHistory = async () => {
    try {
      const history = await getStreakHistory(); // Hämta historiken
      console.log('Loading history:', history);
  
      setStreakHistory(history);
  
      // Kontrollera längsta streak från historiken
      let longestStreakFromHistory = 0;
      history.forEach((streak) => {
        const startDate = streak.startDate ? new Date(streak.startDate) : null;
        const endDate = streak.endDate ? new Date(streak.endDate) : null;
  
        // Validera datumen
        if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
          console.warn("Ogiltiga datum i streak:", streak);
          return; // Hoppa över denna streak om datumen inte är giltiga
        }
  
        // Sätt tiden till midnatt för konsekvens
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
  
        // Beräkna korrekt längd (inkludera både start och slut)
        const calculatedLength = Math.ceil(
          (endDate - startDate) / (1000 * 60 * 60 * 24)
        ) + 1;
  
        if (calculatedLength > longestStreakFromHistory) {
          longestStreakFromHistory = calculatedLength;
        }
      });
  
          // Kontrollera om streakCount är större än det som är sparat
    const savedStreakCount = await AsyncStorage.getItem("streakCount");
    const parsedStreakCount = savedStreakCount ? parseInt(savedStreakCount) : 0;

    // Jämför med nuvarande streak och sätt det längsta värdet
    const longestStreakOverall = Math.max(
      longestStreakFromHistory,
      parsedStreakCount
    );

    console.log(
      "Historik längsta streak:",
      longestStreakFromHistory,
      "Nuvarande streak:",
      parsedStreakCount,
      "Beräknad längsta streak totalt:",
      longestStreakOverall
    );
  
      if (longestStreakOverall !== bestStreak) {
        console.log('Uppdaterar bestStreak till:', longestStreakOverall);
        setBestStreak(longestStreakOverall);
        await saveSetting('bestStreak', longestStreakOverall); // Spara bestStreak
      }
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


  // Lägg till denna useEffect högst upp med andra useEffect-hooks
useEffect(() => {
  if (addModalVisible) {
    const yesterday = new Date(Date.now() - 2 * 86400000);
    const twoDaysAgo = new Date(Date.now() - (3 * 86400000));
    
    setNewStartDate(twoDaysAgo);
    setNewEndDate(yesterday);
  }
}, [addModalVisible]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    (async () => {
      await requestNotificationPermission();
      // ... övrig init-kod ...
    })();
  }, []);

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
    // Normalisera datumen till midnatt
    const startDate = new Date(newStreak.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(newStreak.endDate);
    endDate.setHours(0, 0, 0, 0);

    // Beräkna längden
    const calculatedLength = Math.ceil(
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    ) + 1; // +1 för att inkludera både start och slut
    newStreak.length = calculatedLength;

    console.log("Ny streak som sparas (med normaliserade datum):", newStreak);

    const history = await getStreakHistory();
    const updatedHistory = [...history, newStreak];
    await saveStreakHistory(updatedHistory);

    if (calculatedLength > bestStreak) {
      setBestStreak(calculatedLength);
      await saveSetting("bestStreak", calculatedLength);
    }

    console.log("Streak added to history:", newStreak);
    loadStreakHistory();
  } catch (error) {
    console.error("Error adding streak to history:", error);
  }
};

const removeStreak = async (id) => {
  try {
    const history = await getStreakHistory();
    const updatedHistory = history.filter((streak) => streak.id !== id);
    await saveStreakHistory(updatedHistory);
    setStreakHistory(updatedHistory);
    
    // Beräkna ny bestStreak efter borttagning
    const longestFromHistory = updatedHistory.length > 0 
      ? Math.max(...updatedHistory.map(streak => streak.length))
      : 0;
      
    // Jämför med nuvarande streak
    const newBestStreak = Math.max(longestFromHistory, streakCount);
    
    // Uppdatera bestStreak
    setBestStreak(newBestStreak);
    await saveSetting('bestStreak', newBestStreak);
    
    console.log(`Streak med ID ${id} togs bort och bestStreak uppdaterad till ${newBestStreak}`);
  } catch (error) {
    console.error("Error removing streak:", error);
  }
};
  

  const streakRef = useRef(null);

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
  
  

  const triggerTestNotification = async () => {
    console.log("triggerTestNotification startar...");
    
    // Kontrollera tillstånd för notiser
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log("Notistillstånd saknas. Avbryter.");
      return;
    }
  
    // Skapa en exakt triggertid 5 sekunder framåt
    const now = new Date();
    const triggerDate = new Date(now.getTime() + 5000); // 5 sekunder framåt
    console.log("Nuvarande tid:", now);
    console.log("Planerad triggertid:", triggerDate);
  
    try {
      // Schemalägg notis med exakt tid
      console.log("Använder trigger.date med värde:", triggerDate.toLocaleString());
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.testTitle'),
          body: i18n.t('notifications.testBody'),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
  
      console.log("Testnotis schemalagd.");
      Alert.alert(i18n.t('notifications.scheduledTitle'), i18n.t('notifications.scheduledBody'));
    } catch (error) {
      console.error("Fel vid schemaläggning av testnotis:", error);
      Alert.alert(i18n.t('notifications.errorTitle'), i18n.t('notifications.errorBody'));
    }
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
    setTempNotificationTime(new Date(notificationTime.getTime()));
    setNotificationDatePickerVisibility(true);
  };
  
  const hideNotificationDatePicker = () => {
    setNotificationDatePickerVisibility(false);
  };

  /** Stäng inställningar och alla notis-relaterade modaler (annars kan en osynlig Modal blockera tryck). */
  const closeSettingsFully = () => {
    setSettingsVisible(false);
    setModalVisible(false);
    setNotificationDatePickerVisibility(false);
  };

  const openSettingsClean = () => {
    setModalVisible(false);
    setNotificationDatePickerVisibility(false);
    setSettingsVisible(true);
  };

  /** Stäng tids-modalen och gå tillbaka till inställningar (samma som Avbryt / Android tillbaka). */
  const closeTimeModal = () => {
    hideNotificationDatePicker();
    setModalVisible(false);
    setSettingsVisible(true);
  };
  
  const handleNotificationDateConfirm = async (date) => {
    try {
      console.log("Ny vald tid (lokal):", date.toLocaleString());
  
      // Validera tiden – om den är i det förflutna, flytta till nästa dag
      const now = new Date();
      if (date < now) {
        console.warn("Vald tid är förfluten, flyttar till nästa dag.");
        date.setDate(date.getDate() + 1);
      }
  
      // Uppdatera tiden och spara den
      setTempNotificationTime(date);
      setNotificationTime(date);
      hideNotificationDatePicker();
      await saveSetting('notificationTime', date);
  
      // Rensa eventuella gamla notiser och schemalägg den nya
      if (notificationActive) {
        console.log("Rensar tidigare notiser och schemalägger ny.");
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      console.error("Fel vid hantering av notistid:", error);
    }
  };
  
  

  // Begär tillstånd för notiser
  const requestNotificationPermission = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      console.log("Befintlig status för notiser:", existingStatus);
  
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("Ny status efter förfrågan:", finalStatus);
      }
  
      if (finalStatus !== 'granted') {
        alert(t('notifications.permissionReminders'));
        return false;
      }
      console.log("Notistillstånd beviljat!");
      return true;
    } else {
      alert(t('notifications.physicalDevice'));
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
      t('alerts.resetConfirmTitle'),
      t('alerts.resetStreakBody'),
      [
        {
          text: t('common.cancel'),
          style: "cancel"
        },
        {
          text: t('common.yesReset'),
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
      startDate: streakStartDate ? new Date(streakStartDate).toLocaleDateString('sv-SE') : t('history.unknown'),
      endDate: storageDateKey(),
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
    Alert.alert(t('alerts.streakResetTitle'), t('alerts.streakResetBody'));
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
      t('alerts.resetBestTitle'),
      t('alerts.resetBestBody'),
      [
        {
          text: t('common.cancel'),
          style: "cancel"
        },
        {
          text: t('common.yesReset'),
          onPress: () => {
            resetBestStreak();
          }
        }
      ]
    );
  };

  const resetBestStreak = async () => {
    // 1. Hämta historiken
    const history = await getStreakHistory();
  
    // 2. Om du har historik kvar, fråga om du verkligen vill radera + hur den ska hanteras
    if (history.length > 0) {
      Alert.alert(
        t('alerts.bestNotResetTitle'),
        t('alerts.bestNotResetBody')
      );
      return;
    }
  
    // 3. Nu vet vi att historiken är tom
    //    => Då vill vi aldrig sätta bestStreak lägre än nuvarande streak.
    if (streakCount > 0) {
      // Sätt bestStreak = streakCount
      setBestStreak(streakCount);
      await saveSetting('bestStreak', streakCount);
      Alert.alert(
        t('alerts.bestUpdatedTitle'),
        t('alerts.bestUpdatedBody', { count: streakCount })
      );
    } else {
      // Om streakCount också är 0 eller av någon anledning lägre
      setBestStreak(0);
      await saveSetting('bestStreak', 0);
      Alert.alert(
        t('alerts.bestClearedTitle'),
        t('alerts.bestClearedBody')
      );
    }
  };

  const today = new Date();


  //Hantera loggning av 
  const handleLogRun = async (success) => {
    const todayDateString = storageDateKey();
  
    console.log('Dagens datum:', todayDateString);
    console.log('Är loggad idag:', isRunLoggedToday);

    if (success && !isRunLoggedToday) {
      if (streakCount >= 9999) {
        Alert.alert(t('alerts.maxDaysTitle'), t('alerts.maxDaysBody'));
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
    
      // 🚨 Nytt: Kontroll av streakRef innan rotation
      if (streakRef.current) {
        console.log('Roterar streak-cirkeln...'); // Ny logg för felsökning
        streakRef.current.rotate(); // Roterar streak-cirkeln
      } else {
        console.warn('streakRef är inte kopplad.'); // Ny varning om streakRef inte är kopplad
      }
    
      setLogModalVisible(false);
      playSound();
      triggerVibration();
    

if (streakCount === 0) {
  const todayDate = new Date();
  setStreakStartDate(todayDate);
  await saveSetting('streakStartDate', todayDate.toDateString());
}

    } else if (!success) {
      Alert.alert(t('alerts.goalNotMetTitle'), t('alerts.goalNotMetBody'));
      setLogModalVisible(false);
    } else {
      Alert.alert(t('alerts.alreadyLoggedTitle'), t('alerts.alreadyLoggedBody'));
      setLogModalVisible(false);
    }

    // await scheduleDailyNotification();

  };
  

  useEffect(() => {
    hydrateI18nLanguage();
  }, []);

  // Effekt-hook som körs när komponenten laddas
  useEffect(() => {
    console.log("App laddas, registrerar för push-notiser...");
    registerForPushNotificationsAsync();
    loadSettings();
    setRandomQuote();
    checkDate();
  }, [activityMode, i18n.language]);

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
          t('alerts.updateTitle'),
          t('alerts.updateBody'),
          [{ text: t('common.ok'), onPress: () => console.log('Popup visad för ny version') }]
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
          console.log('Appen är aktiv igen. Laddar inställningar och kontrollerar datum...');
          try {
            loadSettings(); // Ladda sparade inställningar
            checkDate();    // Kontrollera och uppdatera datumstatus
          } catch (error) {
            console.error('Fel vid hantering av appens tillståndsändring:', error);
          }
        }
      };
    
      const subscription = AppState.addEventListener('change', handleAppStateChange);
    
      return () => {
        console.log('Rensar appens tillståndsändringslyssnare...');
        clearInterval(checkDateInterval); // Rensa intervallet
        if (subscription) subscription.remove(); // Rensa prenumerationen
      };
    }, []);

    useEffect(() => {
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log("Notis mottagen:", notification);
      });
    
      // Städa upp efteråt för att undvika minnesläckor
      return () => {
        subscription.remove();
      };
    }, []);


  // Registrera för pushnotiser
  const registerForPushNotificationsAsync = async () => {
    try {
      if (Device.isDevice) {
        console.log("Kontrollerar push-notisbehörighet...");
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log("Befintlig status:", existingStatus);
  
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          console.log("Ny status efter förfrågan:", finalStatus);
        }
  
        if (finalStatus !== 'granted') {
          alert(t('notifications.permissionReminders'));
          return false;
        }
        console.log("Notisbehörighet godkänd.");
        return true;
      } else {
        alert(t('notifications.physicalDevice'));
        return false;
      }
    } catch (error) {
      console.error("Fel vid registrering av push-notiser:", error);
      return false;
    }
  };


  const loadSettings = async () => {
    try {
      // Ladda encouragement-visning
      const encouragementShown = await AsyncStorage.getItem('encouragementShown');
      setEncouragementShown(encouragementShown === 'true');
      console.log('encouragementShown:', encouragementShown);
  
      // Hantering av notiser
      const timeString = await AsyncStorage.getItem('notificationTime');
      if (timeString !== null) {
        const savedTime = new Date(timeString);
        console.log('Laddad notificationTime:', savedTime);
  
        // Validera att tiden är giltig och i framtiden
        if (savedTime < new Date()) {
          console.warn('Sparad tid är förfluten, flyttar till nästa dag.');
          savedTime.setDate(savedTime.getDate() + 1);
        }
  
        setNotificationTime(savedTime);
        setTempNotificationTime(savedTime);
      } else {
        console.log('Ingen notificationTime sparad.');
      }
  
      const savedNotificationActive = await AsyncStorage.getItem('notificationActive');
      const isActive = savedNotificationActive === 'true';
      setNotificationActive(isActive);
      console.log('notificationActive:', isActive);
  
      // Ladda tema
      const theme = await AsyncStorage.getItem('darkTheme');
      setDarkTheme(theme === 'true');
      console.log('darkTheme:', theme);
  
      // Ladda streak-startdatum
      const savedStreakStartDate = await AsyncStorage.getItem('streakStartDate');
      if (savedStreakStartDate !== null) {
        setStreakStartDate(new Date(savedStreakStartDate));
      } else {
        setStreakStartDate(null); // Sätt till null om ingen startdatum finns
      }
  
      // Ladda total distans
      const totalDistance = await AsyncStorage.getItem('showTotalDistance');
      setShowTotalDistance(totalDistance !== 'false');
      console.log('showTotalDistance:', totalDistance);
  
      // Ladda motivationscitat
      const motivationalQuote = await AsyncStorage.getItem('showMotivationalQuote');
      setShowMotivationalQuote(motivationalQuote !== 'false');
      console.log('showMotivationalQuote:', motivationalQuote);
  
      // Ladda nuvarande streak
      const savedStreakCount = await AsyncStorage.getItem('streakCount');
      if (savedStreakCount !== null) {
        setStreakCount(parseInt(savedStreakCount));
      } else {
        setStreakCount(0);
        saveSetting('streakCount', 0);
      }
      console.log('streakCount:', savedStreakCount);
  
      // Ladda längsta streak (bestStreak)
      const bestStreakString = await AsyncStorage.getItem('bestStreak');
      let longestStreakFromStorage = bestStreakString ? parseInt(bestStreakString) : 0;
  
      // Hämta historik och jämför längsta streaken
      const history = await getStreakHistory();
      const longestStreakFromHistory = history.length > 0
        ? Math.max(...history.map((streak) => streak.length))
        : 0;
  
      // Beräkna längsta streak totalt
      const longestStreakOverall = Math.max(longestStreakFromStorage, longestStreakFromHistory, streakCount);
      setBestStreak(longestStreakOverall);
      await saveSetting('bestStreak', longestStreakOverall);
      console.log('Längsta streak beräknad och sparad:', longestStreakOverall);
  
      // Ladda övriga inställningar
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
      const todayKey = storageDateKey();
      const savedRunLoggedDateString = savedRunLoggedDate ? storageDateKey(new Date(savedRunLoggedDate)) : null;
      if (savedRunLoggedDateString !== null && savedRunLoggedDateString === todayKey) {
        setIsRunLoggedToday(true);
        await saveSetting('isRunLoggedToday', true);
        console.log(`loadSettings - Run logged today: ${savedRunLoggedDateString}`);
      }
  
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
  

  const saveSetting = async (key, value) => {
    try {
      const currentValue = await AsyncStorage.getItem(key);
      if (currentValue !== value.toString()) {
        console.log(`Sparar inställning ${key} med värde ${value}`);
        await AsyncStorage.setItem(key, value.toString());
      } else {
        console.log(`Inställning ${key} är redan ${value}. Ingen sparning behövs.`);
      }
    } catch (e) {
      console.error(`Misslyckades med att spara ${key}.`, e);
    }
  };
  

  // Sätt ett slumpmässigt citat baserat på aktivitetstyp
  const setRandomQuote = () => {
    const key =
      activityMode === 'walk'
        ? 'quotes.walking'
        : activityMode === 'cycling'
          ? 'quotes.cycling'
          : activityMode === 'workout'
            ? 'quotes.workout'
            : 'quotes.running';
    const quotes = i18n.t(key, { returnObjects: true });
    const list = Array.isArray(quotes) ? quotes : [];
    if (list.length === 0) return;
    setMotivationalQuote(list[Math.floor(Math.random() * list.length)]);
  };
  

    let isSchedulingNotification = false; // Om du vill behålla denna variabel globalt kan du lägga den utanför funktionen

    const scheduleDailyNotification = async (timeOverride) => {
      try {
        const notifTime = timeOverride ?? notificationTime;
        if (!notifTime || isNaN(notifTime.getTime())) {
          console.error("Fel: notificationTime är ogiltig:", notifTime);
          return;
        }

        console.log("Schemalägger daglig notis på:", notifTime.toLocaleString());
        await Notifications.cancelAllScheduledNotificationsAsync();

        // expo-notifications kräver trigger med `type` (Date-objekt som ensam trigger är ogiltigt).
        const trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: notifTime.getHours(),
          minute: notifTime.getMinutes(),
        };

        console.log("Schemalägger daglig notis (hour/minute):", trigger.hour, trigger.minute);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: i18n.t('notifications.dailyTitle'),
            body: i18n.t('notifications.dailyBody'),
          },
          trigger,
        });

        console.log(
          `Daglig notis schemalagd (dagligen kl. ${trigger.hour}:${String(trigger.minute).padStart(2, "0")})`
        );
      } catch (error) {
        console.error("Fel vid schemaläggning av notis:", error);
      }
    };
  

  // Schemalägg notis för streak
  const scheduleStreakNotification = async (streak) => {
    const typeLabel = i18n.t(`streakType.${activityMode}`);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.congratsTitle'),
        body: i18n.t('notifications.streakBody', { streak, type: typeLabel }),
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

  const confirmTime = async () => {
    console.log("Bekräftar tid:", tempNotificationTime);
  
    // 1. Skapa en lokal "nyTid" som håller den nya tidpunkten
    const nyTid = new Date(tempNotificationTime);
  
    // 2. Sätt state, men för säkerhets skull också spara i en lokal var:
    setNotificationTime(nyTid);
  
    // 3. Spara i AsyncStorage
    await saveSetting("notificationTime", nyTid);
  
    // 4. Om notiser är aktiva, schemalägg
    if (notificationActive) {
      console.log("Bekräftar och schemalägger notisen med nyTid:", nyTid.toString());
      await scheduleDailyNotification(nyTid); // ← passera in “nyTid” som argument
    }
  
    closeTimeModal();
  };

  // Avbryt tidändring för notiser
  const cancelTime = () => {
    closeTimeModal();
  };

  const handleTimePickerConfirm = (date) => {
    console.log("Tid vald (endast temp):", date.toLocaleString());
    setTempNotificationTime(date);
    hideNotificationDatePicker();
  };

  // Växla notisstatus
  const toggleNotification = async () => {
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) return;
  
    const newNotificationState = !notificationActive;
    setNotificationActive(newNotificationState);
    await saveSetting('notificationActive', newNotificationState);
  
    if (!newNotificationState) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("Alla tidigare notiser har rensats.");
    }
  };
  
  // Lägg till useEffect för att schemalägga dagliga notiser när notificationActive ändras
  useEffect(() => {
    if (notificationActive && notificationTime) {
      console.log("Scheduling daily notification. Notification active:", notificationActive);
     scheduleDailyNotification(notificationTime);
    }
  }, [notificationActive, notificationTime, i18n.language]);
  
  
  

  // Kontrollera datum för att återställa streak vid behov
  const checkDate = async () => {
    const currentDate = storageDateKey();
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
  
    // await scheduleDailyNotification();
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
    const typeLabel = t(`streakType.${activityMode}`);
    const result = await Share.share({
      message: t('share.message', { count: streakCount, type: typeLabel }),
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
      Alert.alert(t('alerts.maxDaysTitle'), t('alerts.maxDaysBody'));
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
          <TouchableOpacity onPress={openSettingsClean} style={styles.menuIcon}>
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
        {t('start')}: {streakStartDate ? new Date(streakStartDate).toLocaleDateString(localeTag) : new Date().toLocaleDateString(localeTag)}
  </Text>
  {showFullDate ? (
    (() => {
      const { years, months, days } = calculateDateDifference(new Date().setDate(new Date().getDate() - streakCount), new Date());
      return (
        <View style={styles.fullDateContainer}>
          {years > 0 && (
            <Text style={[styles.streakText, darkTheme && styles.darkText, { fontSize: 40 }]}>
              {years} {t('years')}
            </Text>
          )}
          {months > 0 && (
            <Text style={[styles.streakText, darkTheme && styles.darkText, { fontSize: 40 }]}>
              {months} {t('months')}
            </Text>
          )}
          {days > 0 && (
            <Text style={[styles.streakText, darkTheme && styles.darkText, { fontSize: 40 }]}>
              {days} {t('daysShort')}
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
              <Text style={darkTheme ? styles.darkBestStreakLabel : styles.bestStreakLabel}>{t('history.longestLabel')}</Text>
              <Text style={darkTheme ? styles.darkBestStreakCount : styles.bestStreakCount}>{bestStreak} {t('days')}</Text>
            </Animatable.View>
          )}

<LogButton onLog={handleLogRun} darkTheme={darkTheme} />

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
            <Text style={darkTheme && styles.darkSyncButtonText}>{t('retro.cta')}</Text>
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
                <Text style={[styles.modalText, darkTheme && styles.darkText]}>{t(`retro.${activityMode}`)}</Text>
                <TouchableOpacity
  style={[styles.button, styles.buttonConfirm]}
  onPress={showRetroactiveDatePicker}
>
  <Text style={styles.textStyle}>{t('common.chooseDate')}</Text>
</TouchableOpacity>
<DateTimePickerModal
  isVisible={isRetroactiveDatePickerVisible}
  mode="date"
  locale={i18n.language.startsWith('sv') ? 'sv' : 'en_GB'}
  is24Hour={true}
  onConfirm={handleRetroactiveDateConfirm}
  onCancel={hideRetroactiveDatePicker}
  maximumDate={today}
/>

                <TouchableOpacity
                  style={[styles.button, styles.buttonConfirm]}
                  onPress={setRetroactiveStreak}
                >
                  <Text style={styles.textStyle}>{t('common.confirm')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setRetroactiveModalVisible(false)}
                >
                  <Text style={styles.textStyle}>{t('common.cancel')}</Text>
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
      <Text style={[styles.modalText, darkTheme && styles.darkText]}>{t('encouragement.title')}</Text>
      <Text style={[styles.modalText, darkTheme && styles.darkText]}>
        {t('encouragement.body')}
      </Text>
      <TouchableOpacity
        style={[styles.button, styles.buttonConfirm]}
        onPress={() => setEncouragementVisible(false)}
      >
        <Text style={styles.textStyle}>{t('common.ok')}</Text>
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
                <Text style={[styles.modalText, darkTheme && styles.darkText]}>{t(`logModal.${activityMode}`, { duration: t(`duration.${activityMode}`) })}</Text>
                <TouchableOpacity
                  style={[styles.button, styles.buttonConfirm]}
                  onPress={() => handleLogRun(true)}
                >
                  <Text style={styles.textStyle}>{t('common.yesAbsolutely')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setLogModalVisible(false)}
                >
                  <Text style={styles.textStyle}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>


  <Modal
  animationType="slide"
  transparent={true}
  visible={settingsVisible}
  onRequestClose={closeSettingsFully}
>
  <View style={styles.centeredView}>
    <View style={[styles.modalView, darkTheme && styles.darkModalView]}>
      <Text style={[styles.modalText, darkTheme && styles.darkText]}>{t('settings.title')}</Text>
      <View style={styles.switchContainer}>
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>{t('settings.language')}</Text>
        <View style={styles.languageRow}>
          <TouchableOpacity
            style={[styles.languageChip, i18n.language === 'en' && styles.languageChipActive]}
            onPress={() => setAppLanguage('en')}
          >
            <Text style={[styles.languageChipText, i18n.language === 'en' && styles.languageChipTextOnActive]}>{t('settings.languageEnglish')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageChip, i18n.language === 'sv' && styles.languageChipActive]}
            onPress={() => setAppLanguage('sv')}
          >
            <Text style={[styles.languageChipText, i18n.language === 'sv' && styles.languageChipTextOnActive]}>{t('settings.languageSwedish')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.switchContainer}>
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>{t('settings.darkTheme')}</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={darkTheme ? '#f5dd4b' : '#f4f3f4'}
          onValueChange={toggleTheme}
          value={darkTheme}
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>{t('settings.chooseBackground')}</Text>
        <View style={styles.backgroundButtonContainer}>
          <TouchableOpacity onPress={() => changeBackground('grass')}>
            <Text style={styles.backgroundButton}>{t('settings.bgLight')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeBackground('dark')}>
            <Text style={styles.backgroundButton}>{t('settings.bgDark')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeBackground('olive')}>
            <Text style={styles.backgroundButton}>{t('settings.bgOlive')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeBackground('cloud')}>
            <Text style={styles.backgroundButton}>{t('settings.bgCloud')}</Text>

          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.switchContainer}>
  <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>{t('settings.showFullDate')}</Text>
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
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>{t('settings.showQuotes')}</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={showMotivationalQuote ? '#f5dd4b' : '#f4f3f4'}
          onValueChange={toggleMotivationalQuote}
          value={showMotivationalQuote}
        />
      </View>
      <View style={styles.switchContainer}>
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>{t('settings.showBest')}</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={showBestStreak ? '#f5dd4b' : '#f4f3f4'}
          onValueChange={toggleBestStreak}
          value={showBestStreak}
        />
      </View>

      <View style={styles.switchContainer}>
  <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>{t('settings.showRetro')}</Text>
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
  <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>{t('settings.showShare')}</Text>
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
    title={notificationActive ? t('notifications.on') : t('notifications.off')}
    buttonStyle={[
      styles.smallButton,
      notificationActive ? styles.activeButton : styles.inactiveButton,
    ]}
    onPress={toggleNotification}
    containerStyle={styles.smallButtonContainer}
  />
<Button
  icon={<Icon name="clock-o" size={15} color="white" />}
  title={`${t('notifications.reminder')}: ${notificationTime.getHours()}:${notificationTime.getMinutes() < 10 ? '0' : ''}${notificationTime.getMinutes()}`}
  buttonStyle={[styles.smallButton, { backgroundColor: '#42A5F5' }]}
  onPress={() => {
    setTempNotificationTime(new Date(notificationTime.getTime()));
    setSettingsVisible(false);
    handleOpenModal();
  }}
  containerStyle={styles.smallButtonContainer}
/>


</View>

<View style={styles.activityModeContainer}>
        <Text style={[styles.notificationInfoText, darkTheme && styles.darkText]}>{t('settings.activityMode')}</Text>
        <View style={styles.activityButtonsContainer}>
          <TouchableOpacity
            onPress={() => {
              setActivityMode('run');
              saveSetting('activityMode', 'run');
            }}
            style={activityMode === 'run' ? styles.activeActivityButtonContainer : styles.inactiveActivityButtonContainer}
          >
            <Text style={[styles.activityButtonText, darkTheme && styles.darkActivityButtonText]}>{t('settings.modeRun')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActivityMode('walk');
              saveSetting('activityMode', 'walk');
            }}
            style={activityMode === 'walk' ? styles.activeActivityButtonContainer : styles.inactiveActivityButtonContainer}
          >
            <Text style={[styles.activityButtonText, darkTheme && styles.darkActivityButtonText]}>{t('settings.modeWalk')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActivityMode('cycling');
              saveSetting('activityMode', 'cycling');
            }}
            style={activityMode === 'cycling' ? styles.activeActivityButtonContainer : styles.inactiveActivityButtonContainer}
          >
            <Text style={[styles.activityButtonText, darkTheme && styles.darkActivityButtonText]}>{t('settings.modeCycling')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActivityMode('workout');
              saveSetting('activityMode', 'workout');
            }}
            style={activityMode === 'workout' ? styles.activeActivityButtonContainer : styles.inactiveActivityButtonContainer}
          >
            <Text style={[styles.activityButtonText, darkTheme && styles.darkActivityButtonText]}>{t('settings.modeWorkout')}</Text>
          </TouchableOpacity>
        </View>
      </View>


      <View style={styles.buttonsContainer}>
  <TouchableOpacity style={styles.button} onPress={confirmResetStreakCount}>
    <Text style={styles.buttonText}>{t('settings.resetStreak')}</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.button} onPress={confirmResetBestStreak}>
    <Text style={styles.buttonText}>{t('settings.resetBest')}</Text>
  </TouchableOpacity>
</View>

      <View style={styles.closeButtonWrapper}>
  <TouchableOpacity
    style={[styles.smallCloseButton, darkTheme && styles.darkCloseButton]}
    onPress={closeSettingsFully}
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
            onRequestClose={closeTimeModal}
          >
            <View style={styles.centeredView}>
              <View style={[styles.modalView, darkTheme && styles.darkModalView]}>
                <Text style={[styles.modalText, darkTheme && styles.darkText]}>{t('settings.pickTimeTitle')}</Text>
                <TouchableOpacity
  style={[styles.button, styles.buttonConfirm]}
  onPress={showNotificationDatePicker}
>
  <Text style={styles.textStyle}>{t('common.chooseTime')}</Text>
</TouchableOpacity>



<DateTimePickerModal
  isVisible={isNotificationDatePickerVisible}
  mode="time"
  locale={i18n.language.startsWith('sv') ? 'sv' : 'en_GB'}
  is24Hour={true}
  onConfirm={handleNotificationDateConfirm}
  onCancel={hideNotificationDatePicker}
/>

                <TouchableOpacity
                  style={[styles.button, styles.buttonConfirm]}
                  onPress={confirmTime}
                >
                  <Text style={styles.textStyle}>{t('common.confirm')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={cancelTime}
                >
                  <Text style={styles.textStyle}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {showShareButton && (
          <View style={styles.footerContainer}>
            <Button
              icon={<Icon name="share-alt" size={15} color="white" />}
              title={` ${t('share.title')}`}
              buttonStyle={[styles.button, { backgroundColor: '#42A5F5' }]}
              onPress={shareRunstreak}
              containerStyle={styles.buttonContainer}
            />
          </View>

          
          )}
        </View>

        {/* <View style={{ margin: 20 }}>

        <Button
  title="Testa Notis"
  onPress={() => {
    console.log("Testknapp tryckt");
    triggerTestNotification();
  }}
/>

</View> */}
        <View style={[styles.footer, darkTheme && styles.darkHeaderFooter]}>
          <Text style={[styles.copyright, darkTheme && styles.darkHeaderFooterText]}>© Andreas Selin 2025</Text>
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
    <Text style={[styles.historyHeader, darkTheme && styles.darkText]}>{t('history.title')}</Text>

    <FlatList
  data={streakHistory}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => {
    const startDate = new Date(item.startDate).toLocaleDateString(localeTag);
    const endDate = new Date(item.endDate).toLocaleDateString(localeTag);
    const lengthInDays = Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) + 1;

    return (
      <View style={styles.historyCard}>
        <View style={styles.dateContainer}>
          <Text style={styles.historyDateText}>{startDate} → {endDate}</Text>
          <View style={styles.dayCountContainer}>
            <Text style={styles.dayCountText}>{t('history.daysCount', { count: lengthInDays })}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.historyDeleteButton}
          onPress={() => removeStreak(item.id)}
        >
          <Text style={styles.historyDeleteButtonText}>{t('history.remove')}</Text>
        </TouchableOpacity>
      </View>
    );
  }}
  contentContainerStyle={{ paddingVertical: 20 }}
  showsVerticalScrollIndicator={false}
  ListEmptyComponent={() => (
    <View style={styles.emptyContainer}>
      <Icon name="history" size={50} color="#ccc" />
      <Text style={styles.emptyText}>{t('history.empty')}</Text>
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
      <Text style={[styles.modalText, darkTheme && styles.darkText]}>{t('addStreak.title')}</Text>
      
      <Text style={{ marginBottom: 10, fontWeight: 'bold', color: darkTheme ? '#fff' : '#000' }}>{t('addStreak.startDate')}</Text>
      <TouchableOpacity
  style={{ padding: 10, backgroundColor: '#ddd', borderRadius: 5, marginBottom: 10 }}
  onPress={() => setStartDatePickerVisible(true)}
>
  <Text style={{ color: '#333', fontSize: 16 }}>
    {newStartDate ? t('addStreak.startPick', { date: new Date(newStartDate).toLocaleDateString(localeTag) }) : t('addStreak.pickDate')}
  </Text>
</TouchableOpacity>

<DateTimePickerModal
  isVisible={isStartDatePickerVisible}
  mode="date"
  locale={i18n.language.startsWith('sv') ? 'sv' : 'en_GB'}
  date={newStartDate}
  maximumDate={(() => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - 3); // 3 dagar sedan
    maxDate.setHours(0, 0, 0, 0); // Normalisera till midnatt
    return maxDate;
  })()}
  onConfirm={(date) => {
    const localDate = new Date(date);
    localDate.setHours(12, 0, 0, 0);  // Sätt tiden till 12:00 istället för 00:00
    setNewStartDate(localDate);
    setStartDatePickerVisible(false);
}}
  onCancel={() => setStartDatePickerVisible(false)}
/>

<Text style={{ marginBottom: 10, fontWeight: 'bold', color: darkTheme ? '#fff' : '#000' }}>{t('addStreak.endDate')}</Text>
<TouchableOpacity
  style={{ padding: 10, backgroundColor: '#ddd', borderRadius: 5, marginBottom: 10 }}
  onPress={() => setEndDatePickerVisible(true)}
>
  <Text style={{ color: '#333', fontSize: 16 }}>
    {newEndDate ? t('addStreak.endPick', { date: new Date(newEndDate).toLocaleDateString(localeTag) }) : t('addStreak.pickDate')}
  </Text>
</TouchableOpacity>

<DateTimePickerModal
  isVisible={isEndDatePickerVisible}
  mode="date"
  locale={i18n.language.startsWith('sv') ? 'sv' : 'en_GB'}
  date={newEndDate}
  maximumDate={(() => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - 2); // 2 dagar sedan
    maxDate.setHours(0, 0, 0, 0); // Normalisera till midnatt
    return maxDate;
  })()}
  minimumDate={newStartDate} // Behåll denna för att förhindra val före startdatum
  onConfirm={(date) => {
    const localDate = new Date(date);
    localDate.setHours(12, 0, 0, 0);  // Sätt tiden till 12:00 istället för 00:00
    setNewEndDate(localDate);
    setEndDatePickerVisible(false);
}}
  onCancel={() => setEndDatePickerVisible(false)}
/>

      <TouchableOpacity
        style={[styles.button, styles.buttonConfirm]}
        onPress={async () => {
          console.log('StartDate:', new Date(newStartDate).toISOString());
          console.log('EndDate:', new Date(newEndDate).toISOString());
          const diffInMs = new Date(newEndDate) - new Date(newStartDate);
          const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + 1;

          console.log('Calculated days:', days);
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
        <Text style={styles.textStyle}>{t('common.add')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonCancel]}
        onPress={() => setAddModalVisible(false)}
      >
        <Text style={styles.textStyle}>{t('common.cancel')}</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>



<TouchableOpacity
  style={{ padding: 10, backgroundColor: '#28a745', borderRadius: 5, marginBottom: 10, alignSelf: 'center' }}
  onPress={() => setAddModalVisible(true)}
>
  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{t('common.add')}</Text>
</TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.buttonCancel]}
        onPress={() => setHistoryModalVisible(false)}
      >
        <Text style={styles.textStyle}>{t('common.close')}</Text>
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

  buttonsContainer: {
    flexDirection: 'column', // Lägg knapparna vertikalt
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,

  },
  button: {
    width: width * 0.8, // Anpassar bredden till 80% av skärmen
    paddingVertical: height > 600 ? 15 : 10, // Anpassar höjden beroende på skärmhöjd
    marginVertical: 10, // Lägg till mellanrum mellan knappar
    borderRadius: 10, // Rundade hörn
    backgroundColor: '#42A5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // För Android-skuggor
  },
  buttonText: {
    color: '#fff',
    fontSize: width > 320 ? 16 : 14, // Anpassar textstorlek beroende på bredd
    fontWeight: 'bold',
    textAlign: 'center',
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
    bottom: hp('2%'),
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
    marginBottom: hp('2%')
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
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    marginLeft: wp('2%'),
  },
  languageChip: {
    paddingVertical: hp('0.6%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('2%'),
    backgroundColor: '#e0e0e0',
    marginHorizontal: wp('1%'),
    marginVertical: hp('0.25%'),
  },
  languageChipActive: {
    backgroundColor: '#42A5F5',
  },
  languageChipText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#333',
  },
  languageChipTextOnActive: {
    color: '#fff',
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
    marginTop: hp('3%'),
    marginBottom: hp('2%'),
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