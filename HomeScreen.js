import React, {useState, useEffect, useContext} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
} from 'react-native';
import {Appbar, Card, Title, Paragraph} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {ClubContext} from './ClubContext';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import ImagePicker from 'react-native-image-crop-picker';
import storage from '@react-native-firebase/storage';
import {Modal, TextInput, Button} from 'react-native';
import RNRestart from 'react-native-restart';
import kidsImage from '/Users/josephacquah/test8/images/kids.png';

const HomeScreen = ({route}) => {
  const navigation = useNavigation();
  const {clubs, deleteClub} = useContext(ClubContext);
  const [user, setUser] = useState(null);
  const {username} = route.params || {};
  const [showDropdown, setShowDropdown] = useState(false);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const defaultProfilePicture = require('/Users/josephacquah/test8/images/user.png');

  const {width, height} = Dimensions.get('window');

  const changeProfilePicture = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
    }).then(async image => {
      const source = {uri: image.path};
      const profilePictureURL = await uploadImageToServer(source.uri);

      const userId = auth().currentUser.uid;

      // Update the profile picture in the user document
      await firestore()
        .collection('users')
        .doc(userId)
        .set({profilePicture: profilePictureURL}, {merge: true});

      // Update the profile picture in all clubs where user is the creator
      const clubsCreatorRef = firestore()
        .collection('clubs')
        .where('creatorId', '==', userId);
      const clubsCreatorQuerySnapshot = await clubsCreatorRef.get();
      clubsCreatorQuerySnapshot.forEach(async doc => {
        await firestore()
          .collection('clubs')
          .doc(doc.id)
          .set({creatorProfilePicture: profilePictureURL}, {merge: true});
      });

      // Update in all clubs where user is a member
      const clubsRef = firestore().collection('clubs');
      const clubsQuerySnapshot = await clubsRef.get();

      clubsQuerySnapshot.forEach(async doc => {
        const clubData = doc.data();
        const updatedMembersDetails = clubData.membersDetails.map(member => {
          if (member.uid === userId) {
            return {...member, profilePicture: profilePictureURL};
          }
          return member;
        });

        await firestore()
          .collection('clubs')
          .doc(doc.id)
          .update({membersDetails: updatedMembersDetails});
      });

      fetchUser();
      RNRestart.Restart();
    });
  };

  const handleChangeUsername = async () => {
    if (newUsername) {
      const userId = auth().currentUser.uid;

      // Update the username in user document
      await firestore()
        .collection('users')
        .doc(userId)
        .set({username: newUsername}, {merge: true});

      // Update the username in all clubs where user is a creator or member
      const clubsRef = firestore()
        .collection('clubs')
        .where('members', 'array-contains', userId);
      const clubsQuerySnapshot = await clubsRef.get();
      clubsQuerySnapshot.forEach(async doc => {
        const clubData = doc.data();

        // Update creatorUsername if user is the creator
        if (clubData.creatorId === userId) {
          await firestore()
            .collection('clubs')
            .doc(doc.id)
            .set({creatorUsername: newUsername}, {merge: true});
        }

        // Update username in membersDetails if user is a member
        const membersDetails = clubData.membersDetails || [];
        const updatedMembersDetails = membersDetails.map(member => {
          if (member.uid === userId) {
            return {...member, username: newUsername};
          }
          return member;
        });

        await firestore()
          .collection('clubs')
          .doc(doc.id)
          .set({membersDetails: updatedMembersDetails}, {merge: true});
      });

      fetchUser(); // Re-fetch user information
      setNewUsername(''); // Reset new username field
      setUsernameModalVisible(false); // Close modal
      async function restartApp() {
        await handleChangeUsername(); // Make sure it's complete
        RNRestart.Restart();
      }
      restartApp();
    }
  };

  const uploadImageToServer = async uri => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `${auth().currentUser.uid}-profile-picture`;
    const ref = storage().ref(filename);

    return ref
      .put(blob)
      .then(() => ref.getDownloadURL())
      .catch(error => {
        console.error('Failed to upload profile picture:', error);
        throw error; // Re-throwing the error will allow you to handle it in the calling function
      });
  };

  const fetchUser = async () => {
    const userId = auth().currentUser.uid;
    const userDoc = await firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    let shouldRestart = false;

    if (!userData.profilePicture) {
      await firestore().collection('users').doc(userId).set(
        {
          profilePicture: '/Users/josephacquah/test8/images/user.png', // You can mark it as 'default' and handle this case in your UI
        },
        {merge: true},
      );
      userData.profilePicture = '/Users/josephacquah/test8/images/user.png';
      shouldRestart = true;
    }

    // If the user already has a username in Firestore, use it
    if (userData && userData.username) {
      setUser(userData);
    } else {
      // If the username is not set in Firestore, and if the user is signing in through Google, use the part of the email before the "@"
      const emailName = auth().currentUser.email.split('@')[0];
      await firestore()
        .collection('users')
        .doc(auth().currentUser.uid)
        .set({username: emailName}, {merge: true}); // Merges with existing data without overwriting

      setUser({username: emailName});
    }

    // If the flag is true, restart the app
    if (shouldRestart) {
      RNRestart.Restart();
    }
  };

  useEffect(() => {
    if (auth().currentUser) {
      fetchUser();
    }
  }, [clubs]);

  useEffect(() => {
    if (username) {
      // If username was passed as a navigation parameter, use it
      setUser({username: username});
    } else if (auth().currentUser) {
      // Otherwise, fetch user from Firestore
      fetchUser();
    }
  }, [username]);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const messageStyle = {
    textAlign: 'center',
    fontSize: 17,
    ...(width <= 414 && height <= 736
      ? {width: 350, fontSize: 17, marginTop: -100, marginLeft: -50}
      : {width: 350, fontSize: 17, marginTop: 0, marginLeft: 0}),
  };

  const iconStyle = {
    ...(width <= 414 && height <= 736
      ? {top: -20} // add 50px margin to the top if condition met
      : {}),
  };

  const profilePictureStyle = {
    width: 40,
    height: 40,
    borderRadius: 20,
    top: -36,
    ...(width <= 414 && height <= 736
      ? {top: -20} // move down by adjusting top if condition met
      : {}),
  };

  const profilePlaceholderStyle = {
    width: 40,
    height: 40,
    borderRadius: 20,
    top: -38,
    marginRight: 2,
    backgroundColor: '#777',
    ...(width <= 414 && height <= 736 ? {top: -20} : {}),
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.customHeader}>
        {user && <Text style={styles.username}>{user.username}</Text>}
        <Text style={styles.appbarTitle}>Your Clubs</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => navigation.navigate('NewClub')}>
            <Image
              source={require('/Users/josephacquah/test8/images/plus-icon-21722.png')}
              style={[styles.icon, iconStyle]} // Apply the conditional style
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleDropdown}>
            {user && user.profilePicture ? (
              user.profilePicture ===
              '/Users/josephacquah/test8/images/user.png' ? (
                <Image
                  source={defaultProfilePicture}
                  style={[profilePictureStyle]}
                />
              ) : (
                <Image
                  source={{uri: user.profilePicture}}
                  style={[
                    {width: 40, height: 40, borderRadius: 20, top: -36},
                    profilePictureStyle,
                  ]}
                />
              )
            ) : (
              <View
                style={[styles.profilePlaceholder, profilePlaceholderStyle]}
              />
            )}
          </TouchableOpacity>
        </View>
        {showDropdown && (
          <View
            style={[
              styles.dropdown,
              width <= 414 && height <= 736
                ? {top: 65 /* adjust as you like */}
                : {},
            ]}>
            <TouchableOpacity
              onPress={changeProfilePicture}
              style={{paddingVertical: 8}}>
              <Text style={{fontSize: 16}}>Change Profile Picture</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setUsernameModalVisible(true)}
              style={{paddingVertical: 8}}>
              <Text style={{fontSize: 16}}>Change Username</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <ScrollView style={styles.scrollView}>
        {clubs.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              marginTop: 300,
              width: 350,
              left: 22,
            }}>
            <Text style={messageStyle}>
              You're currently not in any clubs. Press the 'plus' button in the
              top right to create or join one.
            </Text>
          </View>
        ) : (
          clubs.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                navigation.navigate('ClubDetail', {
                  title: item.title,
                  clubId: item.id,
                })
              }>
              <View style={styles.card}>
                <ImageBackground
                  source={
                    item.color === 'BlueClub'
                      ? require('/Users/josephacquah/test8/images/BlueClub.png')
                      : item.color === 'PinkClub'
                      ? require('/Users/josephacquah/test8/images/PinkClub.png')
                      : require('/Users/josephacquah/test8/images/YellowClub.png')
                  }
                  style={styles.imageBackground}
                  imageStyle={{borderRadius: 5}}>
                  <Card.Content style={styles.cardContent}>
                    <Title style={styles.clubTitle}>{item.title}</Title>
                    <Paragraph style={styles.clubDescription}>
                      {item.description}
                    </Paragraph>
                    <View style={styles.creatorContainer}>
                      {item.creatorProfilePicture &&
                        (item.creatorProfilePicture ===
                        '/Users/josephacquah/test8/images/user.png' ? (
                          <Image
                            source={defaultProfilePicture}
                            style={styles.profilePicture}
                          />
                        ) : (
                          <Image
                            source={{uri: item.creatorProfilePicture}}
                            style={styles.profilePicture}
                          />
                        ))}

                      {item.creatorUsername && (
                        <Text style={styles.creatorUsername}>
                          {item.creatorUsername}
                        </Text>
                      )}
                    </View>
                  </Card.Content>

                  {/* Club code */}
                  <Text style={styles.clubCodeText}>{item.code}</Text>
                  <TouchableOpacity
                    onPress={() => deleteClub(item.id)}
                    style={styles.deleteButton}>
                    <Image
                      source={require('/Users/josephacquah/test8/images/bin.png')}
                      style={{width: 25, height: 25, tintColor: 'red'}}
                    />
                    {item.isMature && ( // Check the isMature field here
                      <Image
                        source={kidsImage}
                        style={{
                          width: 28,
                          height: 28,
                          tintColor: 'red',
                          marginTop: -26,
                          left: -30,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                </ImageBackground>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={false}
        visible={usernameModalVisible}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}>
          <View style={styles.usernameInputContainer}>
            <TextInput
              placeholder="Enter new username"
              value={newUsername}
              onChangeText={text => setNewUsername(text)}
              style={styles.usernameInput}
            />
          </View>
          <Button title="Save" onPress={handleChangeUsername} />
          <Button
            title="Cancel"
            onPress={() => {
              setNewUsername('');
              setUsernameModalVisible(false);
            }}
          />
          <Text
            style={{
              fontSize: 14,
              textAlign: 'center',
              marginTop: 10,
              fontWeight: '',
            }}>
            Please restart the app after changing your username to guarantee
            that all system updates are applied.
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ...

const styles = StyleSheet.create({
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40, // adjust this value as needed
    overflow: 'visible', // adjust this value as needed
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 56,
  },
  scrollView: {
    marginHorizontal: 10,
    zIndex: -1,
  },
  card: {
    marginBottom: 18,
    borderColor: '#003F5C',
    height: 150, // You can adjust the height and width as needed
    width: '100%',
    zIndex: 1,
  },
  imageBackground: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 5,
    justifyContent: 'flex-end', // Aligns items to the end of the container's main axis
  },
  icon: {
    width: 24,
    height: 24,
    right: 5,
    top: -38,
    tintColor: '#2E3238',
  },
  cardContent: {
    paddingBottom: 50, // Adjust this value to move the text up/down
    paddingLeft: 35, // Adjust this value to move the text left/right// Adjust this value to move the text left/right
  },
  username: {
    position: 'absolute',
    marginLeft: 14,
    top: 5,
    fontSize: 27,
    fontWeight: 'bold',
    fontFamily: 'Ruwudu-Regular',
    color: '#415B8D',
  },
  appbarTitle: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    top: 5,
    fontFamily: 'Ruwudu-Regular',
    color: '#415B8D',
    fontStyle: 'italic',
    fontSize: 18, // Make the title smaller
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20, // to make it circular
    top: -38,
    marginRight: 2,
    backgroundColor: '#777', // or any color you like
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -15,
  },
  profilePicture: {
    width: 50,
    left: -4,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    top: 32,
  },
  creatorUsername: {
    fontFamily: 'Ruwudu-Regular',
    fontSize: 18, // Adjust the font size as needed
    color: '#000',
    top: 30,
    left: -5,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 14,
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  clubCodeText: {
    position: 'absolute',
    bottom: 20, // position it 10px above the bottom edge
    right: 30, // position it 10px from the right edge
    color: '#415B8D',
    fontSize: 18, // adjust the font size as needed
    fontFamily: 'Ruwudu-Regular',
    fontWeight: 'bold', // adjust the text weight as needed
    // Neon effect
    textShadowColor: 'rgba(255, 255, 255, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
  },
  dropdown: {
    position: 'absolute',
    top: 50, // Adjust as per your design
    right: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 5,
    padding: 10, // Add padding to create space
    width: 200, // Set a fixed width
    zIndex: 1000,
    shadowColor: '#000', // Add shadow for depth perception
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  clubTitle: {
    marginLeft: -10, // Adjust this value to move the title to the left
    fontFamily: 'Ruwudu-Regular',
    fontSize: 20, // Adjust this value to change the title size
    fontWeight: 'bold',
    top: 3,
  },
  clubDescription: {
    fontFamily: 'Ruwudu-Regular',
    fontSize: 14, // Adjust this value to change the description size
    marginLeft: -5,
    top: 3,
  },
  usernameInputContainer: {
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 5,
    width: '80%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f5f5f5',
    marginBottom: 15,
  },
  usernameInput: {
    fontSize: 18, // adjust as needed
    color: '#000', // choose a darker color
    borderBottomWidth: 1, // optional, adds a line under the input
    borderColor: '#000', // optional, color of the line
    width: '100%', // optional, sets the width
  },

  // Style as needed
});

export default HomeScreen;
