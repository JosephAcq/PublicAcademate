import React from 'react';
import {
  View,
  TextInput,
  ImageBackground,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native'; // Add this line
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';
import RNExitApp from 'react-native-exit-app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appleAuth from '@invertase/react-native-apple-authentication';
import RNRestart from 'react-native-restart';

const LoginScreen = ({onLogin, onSignUp, onGoogleSignIn, onForgotPassword}) => {
  const navigation = useNavigation();
  const [email, setEmail] = React.useState(''); // Changed variable name from 'username' to 'email'
  const [password, setPassword] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [profilePicture, setProfilePicture] = React.useState(null);

  React.useEffect(() => {
    const checkTermsAccepted = async () => {
      try {
        const value = await AsyncStorage.getItem('termsAccepted');
        if (value !== null && value === 'true') {
          setTermsAccepted(true);
        } else {
          Alert.alert(
            'Terms and Conditions\n',
            "By downloading or using the Academate app, these terms will automatically apply to you \u2013 you should make sure to read them carefully before using the app.\n\nLicense Grant and Restrictions\n\nYou're not allowed to copy or modify the app, any part of the app, or our trademarks in any way. You're not allowed to attempt to extract the source code of the app, and you also shouldn't try to translate the app into other languages or make derivative versions. The app itself, and all the trademarks, copyright, database rights, and other intellectual property rights related to it, still belong to Joseph K. Acquah.\n\nUpdates, Changes, and Payment for Services\n\nJoseph K. Acquah is committed to ensuring that the app is as useful and efficient as possible. For that reason, we reserve the right to make changes to the app or to charge for its services, at any time and for any reason. We will never charge you for the app or its services without making it very clear to you exactly what you're paying for.\n\nData Storage and Security\n\nThe Academate app stores and processes personal data that you have provided to us, to provide our Service. It's your responsibility to keep your phone and access to the app secure. We therefore recommend that you do not jailbreak or root your phone, which is the process of removing software restrictions and limitations imposed by the official operating system of your device. Doing so could make your phone vulnerable to malware/viruses/malicious programs, compromise your phone's security features, and it could mean that the Academate app won't work properly or at all.\n\nThird-Party Services\n\nThe app uses third-party services such as Google Analytics for Firebase and Firebase Crashlytics. Their Terms and Conditions may apply to your use of the app. Please refer to the respective third-party providers' websites for their Terms and Conditions.\n\nInternet Connectivity and Usage Charges\n\nYou should be aware that certain functions of the app will require the app to have an active internet connection, either via Wi-Fi or through your mobile network provider. Joseph K. Acquah cannot take responsibility for the app not working at full functionality if you don't have access to Wi-Fi, and you don't have any of your data allowance left. Also, be mindful of any roaming data charges if you use the app outside of your home territory without turning off data roaming.\n\nDevice Maintenance and Battery Life\n\nAlong the same lines, Joseph K. Acquah cannot always take responsibility for the way you use the app i.e., you need to make sure that your device stays charged \u2013 if it runs out of battery and you can't turn it on to avail the Service, Joseph K. Acquah cannot accept responsibility.\n\nLiability\n\nWith respect to Joseph K. Acquah\u2019s responsibility for your use of the app, when you're using the app, it's important to bear in mind that although we endeavor to ensure that it is updated and correct at all times, we do rely on third parties to provide information to us so that we can make it available to you. Joseph K. Acquah accepts no liability for any loss, direct or indirect, you experience as a result of relying wholly on this functionality of the app.\n\nNo Tolerance for Objectionable Content or Abusive Users\n\nWe have zero tolerance for objectionable content or abusive users. Any user found posting objectionable content or engaging in abusive behavior will be immediately banned from using the service. We reserve the right to determine what constitutes objectionable content and abusive behavior.\n\nUpdates, Termination, and Availability\n\nAt some point, we may wish to update the app or stop providing it altogether. The app is currently available on iOS \u2013 the requirements for the system may change, and you'll need to download the updates if you want to keep using the app. However, you promise to always accept updates to the application when offered to you. Upon any termination, the rights and licenses granted to you in these terms will end, and you must stop using the app, and delete it from your device.\n\nChanges to These Terms and Conditions\n\nWe may update our Terms and Conditions from time to time. Thus, you are advised to review this page periodically for any changes. We will notify you of any changes by posting the new Terms and Conditions on this page.\n\nContact Us\n\nIf you have any questions or suggestions about our Terms and Conditions, do not hesitate to contact us at joeacq72@gmail.com.\n\nThese terms and conditions are effective as of 2023-08-20.\n\nThis Terms and Conditions page was generated by App Privacy Policy Generator",
            [
              {
                text: 'Decline',
                onPress: () => RNExitApp.exitApp(),
                style: 'cancel',
              },
              {
                text: 'Accept',
                onPress: async () => {
                  await AsyncStorage.setItem('termsAccepted', 'true');
                  setTermsAccepted(true);
                },
              },
            ],
          );
        }
      } catch (e) {
        // Handle error in reading value
        console.error(e);
      }
    };

    checkTermsAccepted();
  }, [navigation]);

  GoogleSignin.configure({
    webClientId:
      'YOUR_GOOGLE_WEB_CLIENT_ID', // client ID of type WEB for your server
  });

  const handleLogin = () => {
    auth()
      .signInWithEmailAndPassword(email, password)
      .then(async userCredential => {
        console.log('User logged in:', userCredential);

        // Check if the user has a username already
        const userDoc = await firestore()
          .collection('users')
          .doc(auth().currentUser.uid)
          .get();

        if (userDoc.exists) {
          // Existing user, proceed normally
          (onLogin || (() => {}))(); // Call onLogin after logging in
        } else {
          // First-time login, save user and restart app
          await firestore().collection('users').doc(auth().currentUser.uid).set(
            {
              email: email,
              password: password,
              profilePicture: profilePicture,
              clubs: [],
            },
            {merge: true},
          );
          RNRestart.Restart(); // Restart the app components
        }
      })
      .catch(error => {
        console.error('Failed to log in:', error);
        Alert.alert('Failed to log in:', error.message);
      });
  };

  const generateRandomString = length => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomString;
  };

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(
        userInfo.idToken,
      );
      auth()
        .signInWithCredential(googleCredential)
        .then(async () => {
          await auth().currentUser.getIdToken(true);

          console.log('User signed in with Google!');

          // Check if the user has a username already
          const userDoc = await firestore()
            .collection('users')
            .doc(auth().currentUser.uid)
            .get();

          if (userDoc.exists) {
            // Existing user, proceed normally
            // ... your existing code
          } else {
            // First-time login, save user and restart app
            // ... your Firestore set code
            RNRestart.Restart();
          }

          let username;
          if (userDoc.exists && userDoc.data().username) {
            // Use existing username
            username = userDoc.data().username;
          } else {
            // Extract the username from the email address
            username = userInfo.user.email.split('@')[0];

            // Save the username to Firestore
            await firestore()
              .collection('users')
              .doc(auth().currentUser.uid)
              .set(
                {
                  username: username,
                  profilePicture: profilePicture,
                  clubs: [],
                },
                {merge: true},
              );
          }

          // Navigate to the Home screen
          navigation.navigate('Home', {username: username});
        })
        .catch(error => {
          console.error('Failed to sign in with Google:', error);
        });
    } catch (error) {
      console.error('Google Sign-In error:', error);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const nonce = generateRandomString(32);
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
        nonce: nonce,
      });

      const {identityToken} = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(
        identityToken,
        nonce,
      );

      await auth().signInWithCredential(appleCredential);
      await auth().currentUser.getIdToken(true);

      // Check if the user has a username already
      const userDoc = await firestore()
        .collection('users')
        .doc(auth().currentUser.uid)
        .get();

      if (userDoc.exists) {
        // Existing user, proceed normally
        // ... your existing code
      } else {
        // First-time login, save user and restart app
        // ... your Firestore set code
        RNRestart.Restart();
      }

      let username;
      if (userDoc.exists && userDoc.data().username) {
        // Use existing username
        username = userDoc.data().username;
      } else {
        // Extract the username from the Apple ID email
        const appleIDEmail =
          appleAuthRequestResponse.email || auth().currentUser.email;
        username = appleIDEmail ? appleIDEmail.split('@')[0] : 'Unknown';

        // Save the username to Firestore
        await firestore().collection('users').doc(auth().currentUser.uid).set(
          {
            username: username,
            clubs: [],
            profilePicture: profilePicture,
          },
          {merge: true},
        );
      }

      // Navigate to the Home screen
      navigation.navigate('Home', {username: username});
    } catch (error) {
      console.error('Apple Sign-In error:', error);
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const smallDeviceWidth = 414;
  const smallDeviceHeight = 736;

  const backgroundImage =
    windowWidth <= 414 && windowHeight > 736
      ? require('/Users/josephacquah/OfficialAcademate/images/iPhone.png')
      : windowWidth <= 414 || windowHeight <= 736
      ? require('/Users/josephacquah/OfficialAcademate/images/iPhone8Plus.png')
      : require('/Users/josephacquah/OfficialAcademate/images/iPhone.png');

  const containerStyle = {
    width: '85%',
    padding: 20,
    borderRadius: 10,
    marginBottom: windowWidth <= 414 && windowHeight <= 736 ? -225 : -310,
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.image}>
      <Text
        style={[
          styles.signInText,
          windowWidth <= 414 && windowHeight <= 736 ? {top: 10} : {},
        ]}>
        Sign In
      </Text>
      <View style={containerStyle}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="black" // or any other color you prefer
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="black" // or any other color you prefer
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <View style={styles.signInContainer}>
          <Text style={styles.buttonText}>Sign in:</Text>
          <TouchableOpacity onPress={handleLogin}>
            <Image
              source={require('/Users/josephacquah/OfficialAcademate/images/SignIn.png')}
              style={styles.buttonImage}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              borderRadius: 5,
              width: 220,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
              bottom: 2,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 15,
              }}>
              <Text style={{fontWeight: 'bold', top: 7, right: 2}}>
                Continue With Google{' '}
              </Text>
              <Image
                source={require('/Users//josephacquah/OfficialAcademate/images/search.png')}
                style={styles.googleSignInImage}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAppleSignIn}
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              borderRadius: 5,
              width: 220,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
              top: 4,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={{fontWeight: 'bold', top: 0}}>
                Continue With Apple{' '}
              </Text>
              <Image
                source={require('/Users/josephacquah/OfficialAcademate/images/apple.png')}
                style={styles.appleImage}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.promptContainer}>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.prompt}>Create new account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  image: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    padding: 20,
    borderRadius: 10,
    marginBottom: -510,
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 25, // Increased bottom margin
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  forgotPassword: {
    textAlign: 'left',
    color: 'blue',
    marginBottom: 40, // Adjust these values to move the prompt
  },
  buttonContainer: {
    flexDirection: 'collumn',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30, // Increased bottom margin
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: 'black', // Change color based on your design
  },
  buttonImage: {
    marginLeft: 10,
    width: 50, // Modify these values based on the dimensions of your image
    height: 50, // Modify these values based on the dimensions of your image
  },
  googleSignInImage: {
    width: 25, // Modify these values based on the dimensions of your image
    height: 25, // Modify these values based on the dimensions of your image
    right: 0,
    top: 7,
  },
  promptContainer: {
    alignItems: 'center',
    marginTop: 'auto', // this pushes the view to the bottom
  },
  prompt: {
    color: 'black', // Change the color here
    fontSize: 17,
    bottom: 15,
  },
  appleImage: {
    width: 30, // Modify these values based on the dimensions of your image
    height: 30, // Modify these values based on the dimensions of your image
    bottom: 3,
    left: 0,
  },
  signInText: {
    fontSize: 27,
    fontWeight: 'bold',
    marginTop: 5,
    left: -100,
    color: '#FF7981',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'black',
  },
  orText: {
    width: 30,
    textAlign: 'center',
  },
});

export default LoginScreen;
