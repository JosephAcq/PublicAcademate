import React from 'react';
import {Image, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import homeIcon from '/Users/josephacquah/OfficialAcademate/images/home2.png';
import calendarIcon from './images/calendar.png';
import settingsIcon from '/Users/josephacquah/OfficialAcademate/images/settings.png'; // Added this line

export function CustomTabBarIcon({route, focused, color, size}) {
  return (
    <View
      style={{
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: focused ? '#415B8D' : 'transparent',
        backgroundColor: focused ? '#415B8D' : 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: focused ? -36 : 5,
      }}>
      {route.name === 'HomeTab' && (
        <View
          style={{
            position: 'absolute',
            top: focused ? 7 : 18,
            left: focused ? 8.7 : 8.4,
          }}>
          <Image
            source={homeIcon}
            style={{
              width: 30,
              height: 30,
              tintColor: focused ? 'white' : color,
            }}
          />
        </View>
      )}
      {route.name === 'Calendar' && (
        <View
          style={{
            position: 'absolute',
            top: focused ? 9 : 18,
            left: focused ? 7.7 : 7.3,
          }}>
          <Image
            source={calendarIcon}
            style={{
              width: 29,
              height: 28,
              tintColor: focused ? 'white' : color,
            }}
          />
        </View>
      )}
      {route.name === 'Settings' && (
        <View
          style={{
            position: 'absolute',
            top: focused ? 8.4 : 18,
            left: focused ? 8.2 : 8.2,
          }}>
          <Image
            source={settingsIcon}
            style={{
              width: 31,
              height: 30,
              tintColor: focused ? 'white' : color,
            }}
          />
        </View>
      )}
      {route.name === 'Login' && (
        <Icon
          name={focused ? 'account' : 'account-outline'}
          size={size}
          color={focused ? 'white' : color}
        />
      )}
    </View>
  );
}
