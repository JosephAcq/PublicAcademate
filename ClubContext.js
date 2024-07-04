import React, {createContext, useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export const ClubContext = createContext();

export const ClubProvider = ({children}) => {
  const [clubs, setClubs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const userId = auth().currentUser?.uid;

  useEffect(() => {
    if (userId) {
      const userRef = firestore().collection('users').doc(userId);
      userRef.get().then(doc => {
        if (doc.exists) {
          setCurrentUser({
            uid: userId,
            ...doc.data(),
          });
        }
      });

      // Fetch clubs
      // Fetch clubs
      const clubRef = firestore()
        .collection('clubs')
        .where('members', 'array-contains', userId); // Changed from creatorId to members

      const unsubscribe = clubRef.onSnapshot(querySnapshot => {
        const clubsArray = [];
        querySnapshot.forEach(doc => {
          const clubData = doc.data();
          clubsArray.push({
            id: doc.id,
            creatorUsername: clubData.creatorUsername, // Include creatorUsername in club data
            ...clubData,
          });
        });
        setClubs(clubsArray);
      });

      // Return a cleanup function to unsubscribe when component is unmounted
      return () => unsubscribe();
    }
  }, [userId]); // Dependency on user's ID

  const addClub = club => {
    // Adding a club to Firestore
    firestore()
      .collection('clubs')
      .add(club)
      .then(() => {
        // Handle success (optional)
      })
      .catch(error => {
        // Handle error (optional)
      });
  };

  const setUser = () => {
    const userId = auth().currentUser?.uid;
    const userRef = firestore().collection('users').doc(userId);
    userRef.get().then(doc => {
      if (doc.exists) {
        setCurrentUser({
          uid: userId,
          ...doc.data(),
        });
      }
    });
  };

  const deleteClub = clubId => {
    // Delete from your Firebase Firestore collection
    firestore()
      .collection('clubs')
      .doc(clubId)
      .get()
      .then(doc => {
        if (doc.exists) {
          const membersDetails = doc.data().membersDetails || [];
          const updatedMembersDetails = membersDetails.filter(
            member => member.uid !== userId, // Assuming that each member object has a uid property
          );

          firestore()
            .collection('clubs')
            .doc(clubId)
            .update({
              members: firestore.FieldValue.arrayRemove(userId),
              membersDetails: updatedMembersDetails,
            });
        }
      })
      .catch(error => {
        console.error('Error removing user from club: ', error);
      });
  };

  return (
    <ClubContext.Provider value={{clubs, addClub, currentUser, deleteClub}}>
      {children}
    </ClubContext.Provider>
  );
};
