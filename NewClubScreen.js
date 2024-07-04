import React, {useContext, useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Switch,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ClubContext} from './ClubContext';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import RNRestart from 'react-native-restart';

const NewClubScreen = () => {
  const navigation = useNavigation();
  const {currentUser, addClub} = useContext(ClubContext);
  const [newClub, setNewClub] = useState({
    title: '',
    description: '',
    color: 'BlueClub',
  });
  const [clubCode, setClubCode] = useState(''); // Added for join code
  const [errorMessage, setErrorMessage] = useState(null);
  const [isMatureChat, setIsMatureChat] = useState(false);

  const handleAddClub = () => {
    if (newClub.title.length === 0) {
      setErrorMessage('Club title is required.');
      return;
    }

    if (newClub.description.length === 0) {
      setErrorMessage('Club description is required.');
      return;
    }

    if (newClub.title.length > 15 || newClub.description.length > 45) {
      setErrorMessage('Title or description exceeds character limit.');
      return;
    }
    console.log('Current user:', currentUser);
    const uniqueCode = Math.random().toString(36).substring(2, 8);
    const clubData = {
      code: uniqueCode,
      title: newClub.title,
      description: newClub.description,
      color: newClub.color,
      members: [currentUser?.uid],
      creatorId: currentUser?.uid,
      creatorUsername: currentUser?.username, // Use updated username
      creatorProfilePicture: currentUser?.profilePicture,
      isMature: isMatureChat,
      membersDetails: [
        {
          uid: currentUser?.uid,
          username: currentUser?.username, // Use updated username
          profilePicture: currentUser?.profilePicture,
        },
      ],
    };
    firestore()
      .collection('clubs')
      .add(clubData)
      .then(docRef => {
        // Also update user's profile with the club they just created
        firestore()
          .collection('users')
          .doc(currentUser?.uid)
          .update({
            clubs: firestore.FieldValue.arrayUnion(docRef.id),
          })
          .catch(error =>
            console.log('Error updating user after creating club: ', error),
          );
        setErrorMessage(null); // Clear the error message if club is successfully added
      })

      .catch(error => console.log('Error adding club: ', error));
    setNewClub({title: '', description: '', color: 'BlueClub'});
    navigation.goBack();
  };

  const handleJoinClub = async () => {
    const clubRef = firestore().collection('clubs');
    const snapshot = await clubRef.where('code', '==', clubCode).get();
    if (snapshot.empty) {
      console.log('No matching club found.');
      return;
    }

    snapshot.forEach(doc => {
      clubRef
        .doc(doc.id)
        .update({
          members: firestore.FieldValue.arrayUnion(currentUser?.uid),
          membersDetails: firestore.FieldValue.arrayUnion({
            uid: currentUser?.uid,
            username: currentUser?.username,
            profilePicture: currentUser?.profilePicture,
          }),
        })
        .catch(error => console.log('Error updating club: ', error));
      // Update user's profile with the club they just joined
      firestore()
        .collection('users')
        .doc(currentUser?.uid)
        .update({
          clubs: firestore.FieldValue.arrayUnion(doc.id), // Assuming 'clubs' is an array field of club IDs in user's doc.
        })
        .catch(error =>
          console.log('Error updating user after joining club: ', error),
        );
    });
    navigation.goBack(); // Optionally navigate back
  };

  return (
    <View style={styles.container}>
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      <Text style={styles.enterCodePrompt}>Creating Club</Text>
      <View style={styles.inputWithCounter}>
        <TextInput
          style={styles.input}
          placeholder="Club title"
          placeholderTextColor="black"
          value={newClub.title}
          onChangeText={text => setNewClub({...newClub, title: text})}
        />
        <Text style={styles.counterText}>{newClub.title.length}/15</Text>
      </View>
      <View style={styles.inputWithCounter}>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Club description"
          placeholderTextColor="black"
          value={newClub.description}
          onChangeText={text => setNewClub({...newClub, description: text})}
        />
        <Text style={styles.counterText}>{newClub.description.length}/45</Text>
      </View>
      <View style={styles.matureChatContainer}>
        <Text style={styles.matureChatText}>Mature Chatroom</Text>
        <Switch
          value={isMatureChat}
          onValueChange={value => setIsMatureChat(value)}
        />
      </View>
      <View style={styles.colorPickerContainer}>
        <Text style={styles.colorLabel}>Colors:</Text>
        <View style={styles.colorPicker}>
          <TouchableOpacity
            style={styles.colorOption}
            onPress={() => setNewClub({...newClub, color: 'BlueClub'})}>
            <ImageBackground
              source={require('/Users/josephacquah/test8/images/BlueBotton.png')}
              style={styles.imageBackground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.colorOption}
            onPress={() => setNewClub({...newClub, color: 'PinkClub'})}>
            <ImageBackground
              source={require('/Users/josephacquah/test8/images/RedButton.png')}
              style={styles.imageBackground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.colorOption}
            onPress={() => setNewClub({...newClub, color: 'YellowClub'})}>
            <ImageBackground
              source={require('/Users/josephacquah/test8/images/YellowButton.png')}
              style={styles.imageBackground}
            />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleAddClub}>
        <Text style={styles.buttonText}>Add Club</Text>
      </TouchableOpacity>
      <Text style={styles.enterCodePrompt}>Joining Club</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Code"
        placeholderTextColor="black" // Add this line
        value={clubCode}
        onChangeText={setClubCode}
      />
      <TouchableOpacity style={styles.button} onPress={handleJoinClub}>
        <Text style={styles.buttonText}>Join Club</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  colorLabel: {
    fontSize: 18,
    marginRight: 10,
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
  },
  colorOption: {
    width: 54,
    height: 51,
  },
  imageBackground: {
    flex: 1,
  },
  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF7878',
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  descriptionInput: {
    // Add this style definition
    fontFamily: 'Ruwunda-Regular',
    //... any other styles you want for the description
  },
  enterCodePrompt: {
    fontSize: 18,
    marginBottom: 10,
  },
  inputWithCounter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterText: {
    marginLeft: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  matureChatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  matureChatText: {
    fontSize: 16,
  },
});

export default NewClubScreen;
