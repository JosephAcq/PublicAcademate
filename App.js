import 'react-native-gesture-handler';
import React, {useEffect, useState, useCallback} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';
import NewClubScreen from './NewClubScreen';
import {ClubProvider} from './ClubContext';
import HomeScreen from './HomeScreen';
import CalendarScreen from './CalendarScreen';
import LoginScreen from './LoginScreen';
import ClubDetailScreen from './ClubDetailScreen';
import {CustomTabBarIcon} from './CustomTabBar';
import SettingsScreen from './SettingsScreen';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import firebase from '@react-native-firebase/app';
import SignUpScreen from './SignUpScreen';
import auth from '@react-native-firebase/auth';

const AuthStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const firebaseConfig = {
  apiKey: 'AIzaSyCGlPGmX2Fgt6hP1zINOBntA6rEYmn-KIY  ',
  authDomain: 'acadamate-3bef4.firebaseapp.com',
  databaseURL: 'https://acadamate-3bef4.firebaseio.com',
  projectId: 'acadamate-3bef4',
  storageBucket: 'acadamate-3bef4.appspot.com',
  messagingSenderId: '521230632803',
  appId: '1:521230632803:ios:e5ba86a3fc12ae80fc7556',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const getActiveRouteName = state => {
  if (!state) {
    return '';
  }
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state);
  }
  return route.name;
};

const AuthStackScreen = ({onLogin}) => (
  <AuthStack.Navigator>
    <AuthStack.Screen name="Login" options={{headerShown: false}}>
      {props => <LoginScreen {...props} onLogin={onLogin} />}
    </AuthStack.Screen>
    <AuthStack.Screen
      name="SignUp"
      component={SignUpScreen}
      options={{headerShown: false}}
    />
  </AuthStack.Navigator>
);

function HomeStackScreen({navigation}) {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" options={{headerShown: false}}>
        {props => <HomeScreen {...props} navigation={navigation} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="ClubDetail"
        options={({route}) => ({title: route.params.title})}>
        {props => <ClubDetailScreen {...props} navigation={navigation} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="NewClub"
        component={NewClubScreen}
        options={{headerShown: false}}
      />
    </HomeStack.Navigator>
  );
}

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  const onAuthStateChanged = useCallback(
    newUser => {
      setUser(newUser);
      if (initializing) {
        setInitializing(false);
      }
    },
    [initializing],
  );

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, [onAuthStateChanged]);

  if (initializing) {
    return null; // or a loading spinner
  }

  if (!user) {
    return (
      <ClubProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <AuthStackScreen />
          </NavigationContainer>
        </SafeAreaProvider>
      </ClubProvider>
    );
  }

  return (
    <ClubProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="HomeTab"
            screenOptions={({route, state}) => ({
              tabBarIcon: ({focused, color, size}) => (
                <CustomTabBarIcon
                  route={route}
                  focused={focused}
                  color={color}
                  size={size}
                />
              ),
              tabBarActiveTintColor: '#0F2756',
              tabBarInactiveTintColor: '#393E46',
              tabBarStyle: {
                display:
                  getActiveRouteName(state) === 'ClubDetail' ? 'none' : 'flex',
              },
              headerShown: false,
              tabBarVisible: route => {
                const routeName = getActiveRouteName(route.state);

                const hideOnScreens = ['NewClub', 'ClubDetail']; // put the names of screens where you want to hide the tab bar

                if (hideOnScreens.includes(routeName)) {
                  return false;
                }
                return true;
              },
            })}>
            <Tab.Screen
              name="HomeTab"
              component={HomeStackScreen}
              options={({route}) => ({
                tabBarLabel: '',
                tabBarStyle: (() => {
                  const routeName = getFocusedRouteNameFromRoute(route) ?? '';
                  if (routeName === 'ClubDetail' || routeName === 'NewClub') {
                    return {display: 'none'};
                  }
                  return;
                })(),
              })}
              listeners={({navigation, route}) => ({
                tabPress: e => {
                  const routeName = route.state
                    ? route.state.routes[route.state.index].name
                    : '';

                  if (routeName === 'ClubDetail') {
                    e.preventDefault();
                  }
                },
              })}
            />

            <Tab.Screen
              name="Calendar"
              component={CalendarScreen}
              options={{tabBarLabel: ''}}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{tabBarLabel: ''}}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ClubProvider>
  );
};

export default App;
