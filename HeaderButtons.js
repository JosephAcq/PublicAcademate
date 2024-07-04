import React from 'react';
import {View, Image, TouchableOpacity} from 'react-native';

const HeaderButtons = ({
  toggleSlideLeftPage,
  toggleSlidePage,
  toggleSlideUpPage,
}) => (
  <View style={{flexDirection: 'row', alignItems: 'center'}}>
    <TouchableOpacity onPress={toggleSlideLeftPage}>
      <Image
        source={require('/Users/josephacquah/test8/images/more.png')}
        style={{width: 25, height: 25, marginRight: 10}}
      />
    </TouchableOpacity>
    <TouchableOpacity onPress={toggleSlideUpPage}>
      <Image
        source={require('/Users/josephacquah/test8/images/check.png')}
        style={{width: 25, height: 25, marginRight: 10}}
      />
    </TouchableOpacity>
    <TouchableOpacity onPress={toggleSlidePage}>
      <Image
        source={require('/Users/josephacquah/test8/images/group.png')}
        style={{width: 30, height: 30, marginRight: 10}}
      />
    </TouchableOpacity>
  </View>
);

export default HeaderButtons;
