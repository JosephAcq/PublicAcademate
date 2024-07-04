import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  Button,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {GiftedChat} from 'react-native-gifted-chat';
import DateTimePicker from '@react-native-community/datetimepicker';
import HeaderButtons from './HeaderButtons';
import ChatComponent from './ChatComponent';
import RNRestart from 'react-native-restart';
import DeviceInfo from 'react-native-device-info';
import {Modal} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ClubDetailScreen = ({route}) => {
  const {title, clubId} = route.params;
  const navigation = useNavigation();
  const [messages, setMessages] = React.useState([]);
  const [usernames, setUsernames] = React.useState([]);
  const slideRightAnim = React.useRef(new Animated.Value(500)).current;
  const windowHeight = Dimensions.get('window').height;
  const slideUpAnim = React.useRef(new Animated.Value(windowHeight)).current;
  const [selectedUser, setSelectedUser] = React.useState(null);
  const windowWidth = Dimensions.get('window').width;
  const slideLeftAnim = React.useRef(new Animated.Value(-windowWidth)).current;

  const [eventDescription, setEventDescription] = React.useState('');
  const [eventDate, setEventDate] = React.useState(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [events, setEvents] = React.useState({});
  const [showEventForm, setShowEventForm] = React.useState(false);
  const [showRoles, setShowRoles] = React.useState(false);
  const [roles, setRoles] = React.useState([]);
  const [newRole, setNewRole] = React.useState('');
  const [userRole, setUserRole] = React.useState({});
  const [showRolesList, setShowRolesList] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [isUserBlocked, setIsUserBlocked] = React.useState(false);

  const blockUser = usernameToBlock => {
    const userToBlock = usernames.find(
      user => user.username === usernameToBlock,
    );
    if (userToBlock) {
      if (isUserBlocked) {
        // Unblock the user
        firestore()
          .collection('users')
          .doc(auth().currentUser.uid)
          .update({
            blockedUsers: firestore.FieldValue.arrayRemove(userToBlock.uid),
          });
        setIsUserBlocked(false);
      } else {
        // Block the user
        firestore()
          .collection('users')
          .doc(auth().currentUser.uid)
          .update({
            blockedUsers: firestore.FieldValue.arrayUnion(userToBlock.uid),
          });
        setIsUserBlocked(true);
      }
    }
  };

  const createEvent = async () => {
    try {
      await firestore()
        .collection('events')
        .add({
          clubId: clubId,
          club: title,
          description: eventDescription,
          date: firestore.Timestamp.fromDate(eventDate),
        });

      // Animate slide left to go back
      toggleSlideLeftPage();

      // Animate slide up to come out
      toggleSlideUpPage();
    } catch (error) {
      console.error('Error creating event: ', error);
    }
  };

  const deleteEvent = async eventId => {
    try {
      await firestore().collection('events').doc(eventId).delete();
      alert('Event deleted successfully!');
      RNRestart.Restart();
    } catch (error) {
      console.error('Error deleting event: ', error);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || eventDate;
    setShowDatePicker(false);
    setEventDate(currentDate);
  };

  const user = auth().currentUser;

  useEffect(() => {
    const checkFirstTimeClubEntry = async () => {
      const doc = await firestore()
        .collection('firstTimeClubs')
        .doc(user.uid)
        .get();
      let firstTimeClubs = doc.exists ? doc.data().clubs : [];

      let accountClubKey = `${clubId}-${user.uid}`; // create a key combining clubId and user UID

      if (!firstTimeClubs.includes(accountClubKey)) {
        // Set a flag in AsyncStorage before restarting
        await AsyncStorage.setItem('firstTimeClubInitialized', 'true');

        // Restart the app
        RNRestart.Restart();

        // Add the account-specific club ID to the list of visited clubs
        firstTimeClubs.push(accountClubKey);
        await firestore()
          .collection('firstTimeClubs')
          .doc(user.uid)
          .set({clubs: firstTimeClubs});
      }
    };

    checkFirstTimeClubEntry();
  }, [clubId, user.uid]);

  useEffect(() => {
    // Check the flag in AsyncStorage after app restart
    const checkInitializationMessage = async () => {
      const isFirstTime = await AsyncStorage.getItem(
        'firstTimeClubInitialized',
      );
      if (isFirstTime === 'true') {
        alert('Successfully Initialized Club');
        await AsyncStorage.removeItem('firstTimeClubInitialized'); // Remove the flag
      }
    };

    checkInitializationMessage();
  }, []);

  const toggleEventForm = () => {
    setShowEventForm(!showEventForm);
  };

  const toggleRolesForm = () => {
    setShowRoles(!showRoles);
  };

  const addRole = () => {
    if (newRole && !roles.includes(newRole)) {
      const updatedRoles = [...roles, newRole];
      setRoles(updatedRoles);

      // Save the roles to Firestore
      firestore().collection('clubs').doc(clubId).update({roles: updatedRoles});
    }
    setNewRole(''); // clear the input after adding
  };

  const assignRole = (username, role) => {
    const updatedUserRole = {...userRole, [username]: role};
    setUserRole(updatedUserRole);

    // Save the user role to Firestore
    firestore()
      .collection('clubs')
      .doc(clubId)
      .update({userRoles: updatedUserRole});
  };

  const toggleSlideLeftPage = React.useCallback(() => {
    Animated.timing(slideLeftAnim, {
      toValue: slideLeftAnim._value === 0 ? -windowWidth : 0,
      duration: 300,
      useNativeDriver: false, // Remember to use this flag as false since we're animating non-opacity and non-transform properties
    }).start();
  }, [slideLeftAnim, windowWidth]);

  const toggleSlidePage = React.useCallback(() => {
    Animated.timing(slideRightAnim, {
      toValue: slideRightAnim._value === 0 ? 500 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [slideRightAnim]);

  const toggleSlideUpPage = React.useCallback(() => {
    Animated.timing(slideUpAnim, {
      toValue: slideUpAnim._value === 0 ? windowHeight : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [slideUpAnim, windowHeight]);

  React.useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .where('clubs', 'array-contains', title)
      .onSnapshot(snapshot => {
        const fetchedUsers = snapshot.docs.map(doc => {
          return {
            username: doc.data().username,
            profilePicture: doc.data().profilePicture, // Assuming the profile picture field in Firestore is 'profilePicture'
          };
        });
        console.log('Fetched Users:', fetchedUsers);

        setUsernames(fetchedUsers);
      });

    return () => unsubscribe();
  }, [title]);

  React.useEffect(() => {
    const unsubscribe = firestore()
      .collection('events')
      .where('clubId', '==', clubId) // Added filter to fetch events based on the clubId
      .onSnapshot(snapshot => {
        const fetchedEvents = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const date = data.date.toDate().toISOString().split('T')[0];
          if (fetchedEvents[date]) {
            fetchedEvents[date].push({
              id: doc.id, // Add the document ID here
              name: `${data.description}`,
            });
          } else {
            fetchedEvents[date] = [
              {
                id: doc.id,
                name: `${data.description}`,
              },
            ];
          }
        });
        setEvents(fetchedEvents);
      });
    return () => unsubscribe();
  }, [clubId, title]);

  React.useEffect(() => {
    const unsubscribe = firestore()
      .collection('clubs')
      .doc(clubId)
      .onSnapshot(snapshot => {
        const clubData = snapshot.data();
        setUsernames(clubData.membersDetails || []);
        setRoles(clubData.roles || []);
        setUserRole(clubData.userRoles || {});
      });

    return () => unsubscribe();
  }, [clubId]);

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{marginLeft: -160, marginTop: -2}}>
          <Text style={{fontSize: 20, fontWeight: 'bold'}}>{title}</Text>
        </View>
      ),
      headerBackTitleVisible: false,
      headerRight: () => (
        <HeaderButtons
          toggleSlideLeftPage={toggleSlideLeftPage}
          toggleSlideUpPage={toggleSlideUpPage}
          toggleSlidePage={toggleSlidePage}
        />
      ),
      tabBarVisible: false,
    });
  }, [
    navigation,
    title,
    toggleSlideLeftPage,
    toggleSlidePage,
    toggleSlideUpPage,
  ]);

  const slideRightStyle = {
    transform: [{translateX: slideRightAnim}],
    position: 'absolute',
    right: -15,
    top: 0,
    bottom: 0,
    width: '70%',
    backgroundColor: 'white',
    zIndex: 1000,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  };

  const slideLeftStyle = {
    transform: [{translateX: slideLeftAnim}],
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    zIndex: 1000,
    shadowColor: '#000', // Shadow color
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4, // Elevation for Android
  };

  const slideUpStyle = {
    transform: [{translateY: slideUpAnim}],
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    backgroundColor: 'white',
    zIndex: 1000,
    borderTopLeftRadius: 20, // Rounded corners at the top
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.text}>Welcome to the chat room!</Text>
      </View>
      <ChatComponent clubId={clubId} title={title} />
      <Animated.View style={slideRightStyle}>
        <Text style={{fontSize: 20, fontWeight: 'bold', marginLeft: -6}}>
          Members in Club:
        </Text>
        <View
          style={{
            height: 1,
            backgroundColor: '#FFFFFF',
            marginVertical: 6,
          }}
        />
        {usernames.map((user, index) => (
          <View key={index} style={{marginBottom: 10}}>
            {userRole[user.username] && (
              <Text
                style={{
                  fontSize: 14,
                  color: '#666',
                  marginBottom: 2,
                  marginLeft: -2,
                }}>
                {userRole[user.username]}
              </Text>
            )}
            <TouchableOpacity
              style={{flexDirection: 'row', alignItems: 'center'}}
              onPress={() => {
                setSelectedUser(user.username); // Only set the username
                setModalVisible(true);
              }}>
              <Image
                source={{uri: user.profilePicture}}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginRight: 10,
                }}
              />
              <Text>{user.username}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Modal for displaying roles and cancel button */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
          }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}>
            <View
              style={{backgroundColor: 'white', padding: 20, borderRadius: 10}}>
              {/* Display the selected user's username */}
              <Text
                style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
                {selectedUser}
              </Text>

              {roles.map(role => (
                <Text
                  key={role}
                  style={{
                    fontWeight:
                      userRole[selectedUser] === role ? 'bold' : 'normal',
                    textDecorationLine: 'underline',
                    color: '#007AFF',
                  }}
                  onPress={() => {
                    assignRole(selectedUser, role);
                    setModalVisible(false);
                  }}>
                  {role}
                </Text>
              ))}
              {/* Add Block User button */}
              <Text
                style={{
                  color: isUserBlocked ? '#007AFF' : '#FF3B30',
                  textDecorationLine: 'underline',
                  marginTop: 10,
                }}
                onPress={() => {
                  blockUser(selectedUser);
                  setModalVisible(false);
                }}>
                {isUserBlocked ? 'Unblock User' : 'Block User'}
              </Text>

              <Text
                style={{
                  color: '#FF3B30',
                  textDecorationLine: 'underline',
                  marginTop: 10,
                }}
                onPress={() => setModalVisible(false)}>
                Cancel
              </Text>
            </View>
          </View>
        </Modal>
      </Animated.View>
      <Animated.View style={slideUpStyle}>
        <View style={{alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{fontSize: 20, fontWeight: 'bold'}}>
            Events for {title}:
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: '#FFFFFF',
              marginVertical: 10,
            }}
          />
          {Object.entries(events).map(([date, eventList]) => (
            <View key={date} style={{alignItems: 'center'}}>
              {eventList.map((event, index) => (
                <View
                  key={index}
                  style={{
                    maxWidth: '80%',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}>
                  <Text style={{textAlign: 'center'}}>
                    - ({date}) {event.name}
                  </Text>
                  <TouchableOpacity onPress={() => deleteEvent(event.id)}>
                    <Text style={{color: 'red'}}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Slide Up View for Event Creation */}
      <Animated.View style={slideLeftStyle}>
        <View
          style={{
            height: 1,
            backgroundColor: '#FFFFFF',
            marginVertical: 5,
          }}
        />
        {showEventForm ? (
          <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{fontSize: 24, fontWeight: 'bold'}}>
              Create an Event
            </Text>
            <View
              style={{
                height: 1,
                backgroundColor: '#FFFFFF',
                marginVertical: 25,
              }}
            />
            <View style={styles.eventBox}>
              <TextInput
                placeholder="Event Description"
                placeholderTextColor="#000"
                onChangeText={text => setEventDescription(text)}
                style={[styles.eventInput, {color: '#000'}]}
              />
            </View>

            <Button
              title={`Set Date: ${eventDate.toLocaleDateString()}`}
              onPress={() => setShowDatePicker(true)}
            />
            {showDatePicker && (
              <DateTimePicker
                value={eventDate}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}
            <Button title="Set Event" onPress={() => createEvent()} />
            <Button title="Back" onPress={toggleEventForm} />
          </View>
        ) : showRoles ? (
          <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{fontSize: 24, fontWeight: 'bold'}}>
              Roles Section
            </Text>
            <View
              style={{
                height: 1,
                backgroundColor: '#FFFFFF',
                marginVertical: 25,
              }}
            />
            <View style={styles.roleBox}>
              <TextInput
                placeholder="Enter new role"
                placeholderTextColor="#000"
                value={newRole}
                onChangeText={setNewRole}
                style={[styles.eventInput, {color: '#000'}]}
              />
            </View>
            <Button title="Add Role" onPress={addRole} />

            {/* Button to toggle role list visibility */}
            <Button
              title="Roles"
              onPress={() => setShowRolesList(!showRolesList)}
            />

            {/* Conditionally display roles list */}
            {showRolesList &&
              roles.map((role, index) => <Text key={index}>{role}</Text>)}

            <Button title="Back" onPress={toggleRolesForm} />
          </View>
        ) : (
          <>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <Text style={{fontSize: 24, fontWeight: 'bold'}}>
                Organization Hub
              </Text>
              <View
                style={{
                  height: 1,
                  backgroundColor: '#FFFFFF',
                  marginVertical: 10,
                }}
              />
            </View>

            <Button
              title="Create Event"
              onPress={toggleEventForm}
              color="#A9A9A9"
            />
            <View
              style={{height: 1, backgroundColor: '#000', marginVertical: 5}}
            />
            <Button title="Roles" onPress={toggleRolesForm} color="#A9A9A9" />
            <View
              style={{height: 1, backgroundColor: '#000', marginVertical: 5}}
            />
          </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 50,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
  grayButton: {
    backgroundColor: '#A9A9A9',
    color: 'white',
  },
  eventBox: {
    width: '80%',
    marginVertical: 10,
  },
  eventInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  roleBox: {
    width: '80%',
    marginVertical: 10,
  },
  roleInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
  },
});

export default ClubDetailScreen;
