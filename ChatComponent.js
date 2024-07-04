import React from 'react';
import {GiftedChat} from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {View, TextInput, Button, Modal} from 'react-native';

const ChatComponent = ({clubId, title}) => {
  const [messages, setMessages] = React.useState([]);
  const [reportDescription, setReportDescription] = React.useState('');
  const [isReportModalVisible, setReportModalVisible] = React.useState(false);
  const [reportedMessage, setReportedMessage] = React.useState(null);

  const [blockedUsers, setBlockedUsers] = React.useState([]);

  const handleReport = reportDescription => {
    if (reportedMessage) {
      firestore()
        .collection('reports') // Changed from 'chatrooms' to 'reports'
        .add({
          clubId: clubId, // Added to know which chatroom the report belongs to
          messageId: reportedMessage._id,
          reportDescription: reportDescription,
          reportedBy: auth().currentUser.uid,
          messageContent: reportedMessage.text,
          messageUserId: reportedMessage.user._id,
        })
        .then(() => {
          setReportModalVisible(false);
          setReportedMessage(null);
        })
        .catch(error => {
          console.error('Failed to report message:', error);
        });
    }
  };

  React.useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .doc(auth().currentUser.uid)
      .onSnapshot(doc => {
        if (doc.exists) {
          setBlockedUsers(doc.data().blockedUsers || []); // Make sure the field name matches with Firestore
        }
      });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const initialMessage = {
      _id: 1,
      text: 'Start Chatting!',
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'React Native',
        avatar: 'https://placeimg.com/140/140/any',
      },
    };

    const unsubscribe = firestore()
      .collection('chatrooms')
      .doc(clubId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const fetchedMessages = snapshot.docs
          .map(doc => {
            const message = doc.data();
            return {
              _id: doc.id,
              text: message.text,
              createdAt: message.createdAt.toDate(),
              user: {
                _id: message.user._id,
                name: message.user.username,
                avatar: message.user.avatar,
              },
            };
          })
          .filter(message => !blockedUsers.includes(message.user._id)); // Filter out messages from blocked users

        setMessages([...fetchedMessages, initialMessage]);
      });

    return () => unsubscribe();
  }, [blockedUsers, clubId, title]);

  const onSend = (newMessages = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, newMessages),
    );

    const user = auth().currentUser;
    firestore()
      .collection('users')
      .doc(user.uid)
      .get()
      .then(doc => {
        if (doc.exists) {
          newMessages.forEach(message => {
            firestore()
              .collection('chatrooms')
              .doc(clubId)
              .collection('messages')
              .add({
                _id: message._id,
                text: message.text,
                createdAt: firestore.Timestamp.fromDate(message.createdAt),
                user: {
                  _id: user.uid,
                  username: doc.data().username,
                  avatar: doc.data().profilePicture,
                },
              });
          });
        }
      });
  };

  return (
    <>
      <GiftedChat
        messages={messages}
        onSend={newMessages => onSend(newMessages)}
        user={{
          _id: auth().currentUser ? auth().currentUser.uid : 1,
          name: auth().currentUser ? auth().currentUser.displayName : 'Guest',
        }}
        renderUsernameOnMessage={true}
        onLongPress={(context, message) => {
          setReportedMessage(message);
          setReportModalVisible(true);
        }}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={isReportModalVisible}
        onRequestClose={() => {
          setReportModalVisible(false);
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)', // Optional: adds a dark background
          }}>
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
              width: '80%', // Optional: Set a width
            }}>
            <TextInput
              placeholder="Describe the offense"
              placeholderTextColor="black" // Making the placeholder text black
              style={{
                color: 'black', // Making the input text black
                textAlign: 'center', // Centering text
                height: 50, // Making it square
              }}
              onChangeText={text => setReportDescription(text)}
            />
            <Button
              title="Submit Report"
              onPress={() => handleReport(reportDescription)}
            />
            <Button
              title="Cancel"
              onPress={() => setReportModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ChatComponent;
