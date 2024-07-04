import React from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage'; // Add this line
import ImagePicker from 'react-native-image-crop-picker';

const SignUpScreen = ({navigation}) => {
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [profilePicture, setProfilePicture] = React.useState(
    require('/Users/josephacquah/test8/images/user.png'),
  );

  const [usernameError, setUsernameError] = React.useState(null);
  const [emailError, setEmailError] = React.useState(null);
  const [passwordError, setPasswordError] = React.useState(null);

  const saveUserData = userId => {
    console.log('Attempting to save user data');
    return firestore()
      .collection('users')
      .doc(userId)
      .set({
        username: username,
        profilePicture: profilePicture,
        clubs: [],
      })
      .catch(error => {
        console.error('Failed to save user data:', error);
        console.log('UserID:', userId);
      });
  };

  const handleSignUp = async () => {
    setUsernameError(null);
    setEmailError(null);
    setPasswordError(null);
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      console.log('Is user authenticated?', userCredential.user !== null);
      console.log('User created:', userCredential);
      const userId = userCredential.user.uid;
      await saveUserData(userId);
      saveUserData(userId)
        .then(() => {
          if (profilePicture) {
            return uploadProfilePicture(profilePicture, userId);
          }
        })
        .then(() => {
          navigation.navigate('HomeTab', {screen: 'Home'});
        })
        .catch(error => {
          console.error('Failed in then chain:', error);
        });
    } catch (error) {
      console.error(
        'Failed to create new account:',
        error,
        'Error Code:',
        error.code,
      );

      // Set error messages based on error codes
      if (error.code === 'auth/invalid-email') {
        setEmailError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('Weak password');
      }
    }
  };

  const chooseProfilePicture = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 400,
        cropping: true,
      });
      const source = {uri: image.path};
      setProfilePicture(source.uri);
    } catch (error) {
      console.error('ImagePicker Error:', error);
    }
  };

  const uploadProfilePicture = async (uri, userId) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${userId}-profile-picture`;
      const ref = storage().ref(filename);

      await ref.put(blob);
      const url = await ref.getDownloadURL();
      setProfilePicture(url);

      // Save the profile picture URL to Firestore
      await firestore().collection('users').doc(userId).update({
        profilePicture: url,
      });
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
    }
  };

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const smallDeviceWidth = 414;
  const smallDeviceHeight = 736;

  const inputStyle = {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom:
      windowWidth <= smallDeviceWidth || windowHeight <= smallDeviceHeight
        ? 10
        : 20,
    paddingLeft: 8,
    borderRadius: 10,
  };

  const signUpButtonStyle = {
    marginBottom:
      windowWidth <= smallDeviceWidth || windowHeight <= smallDeviceHeight
        ? 0
        : 20,
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.backButtonContainer,
          windowWidth <= 414 && windowHeight > 736
            ? null
            : windowWidth <= 414 || windowHeight <= 736
            ? styles.smallBackButtonContainer
            : null,
        ]}>
        <Button
          title="Back to Login"
          onPress={() => navigation.navigate('Login')}
          style={[styles.backButton]}
        />
      </View>
      <View style={[styles.imageContainer, {marginTop: 35}]}>
        <Image
          source={require('/Users/josephacquah/test8/images/9814.jpg')}
          style={[
            styles.imageOverUsername,
            // Check if the dimensions are smaller than 414x736
            (windowWidth <= smallDeviceWidth ||
              windowHeight <= smallDeviceHeight) &&
              styles.smallImage,
          ]}
        />
      </View>
      <TextInput
        placeholder="Username"
        placeholderTextColor="black"
        value={username}
        onChangeText={setUsername}
        style={inputStyle}
      />
      {usernameError && <Text style={{color: 'red'}}>{usernameError}</Text>}
      <TextInput
        placeholder="Email"
        placeholderTextColor="black"
        value={email}
        onChangeText={setEmail}
        style={inputStyle}
      />
      {emailError && (
        <Text style={{color: 'red', marginTop: -10}}>{emailError}</Text>
      )}
      <View style={{marginBottom: 10}}>
        <Text style={{color: 'black'}}>
          Password must meet the following requirements:
        </Text>
        <Text style={{color: 'black'}}>• At least 6 characters</Text>
        <Text style={{color: 'black'}}>• At least one number</Text>
        <Text style={{color: 'black'}}>• At least one special character</Text>
      </View>

      <TextInput
        placeholder="Password"
        placeholderTextColor="black"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={inputStyle}
      />
      {passwordError && (
        <Text style={{color: 'red', marginTop: -10}}>{passwordError}</Text>
      )}

      <View style={styles.profilePictureSection}>
        <Text style={styles.profilePictureText}>
          Choose your profile picture:
        </Text>
        <TouchableOpacity
          onPress={chooseProfilePicture}
          style={styles.profilePictureContainer}>
          {profilePicture ? (
            <Image
              source={{uri: profilePicture}}
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.profilePicturePlaceholder} />
          )}
        </TouchableOpacity>
      </View>
      <Button
        title="Sign Up"
        onPress={handleSignUp}
        style={signUpButtonStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20, // Increased the space below each input box
    paddingLeft: 8,
    borderRadius: 10,
  },
  profilePictureContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  profilePicturePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'gray',
  },
  profilePictureSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePictureText: {
    marginRight: 10,
    fontSize: 16,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 60,
    left: 10,
  },
  smallBackButtonContainer: {
    top: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 5, // Add spacing below the image if needed
  },
  imageOverUsername: {
    width: 420, // Adjust the width as needed
    height: 320, // Adjust the height as needed
  },
  smallImage: {
    marginTop: 30,
    width: 370, // Adjust the width for smaller screens
    height: 260, // Adjust the height for smaller screens
  },
});

export default SignUpScreen;
