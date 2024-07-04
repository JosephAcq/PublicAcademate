import React, {useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet, View, Text} from 'react-native';
import {Appbar} from 'react-native-paper';
import {Agenda} from 'react-native-calendars';
import moment from 'moment';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const CalendarScreen = () => {
  const [events, setEvents] = useState({});
  const user = auth().currentUser;

  useEffect(() => {
    const unsubscribes = [];

    if (user) {
      const userUnsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(snapshot => {
          let userClubs = snapshot.exists ? snapshot.data().clubs || [] : [];

          const processSnapshot = snapshot => {
            const newFetchedEvents = {};

            snapshot.docs.forEach(doc => {
              const data = doc.data();
              const date = data.date.toDate().toISOString().split('T')[0];
              if (newFetchedEvents[date]) {
                newFetchedEvents[date].push({
                  id: doc.id,
                  name: `${data.description} (from ${data.club})`,
                });
              } else {
                newFetchedEvents[date] = [
                  {id: doc.id, name: `${data.description} (from ${data.club})`},
                ];
              }
            });

            setEvents(prevEvents => {
              return {...prevEvents, ...newFetchedEvents};
            });
          };

          for (let i = 0; i < userClubs.length; i += 10) {
            const batchQuery = clubs => {
              const unsubscribe = firestore()
                .collection('events')
                .where('clubId', 'in', clubs)
                .onSnapshot(processSnapshot);
              unsubscribes.push(unsubscribe);
            };
            batchQuery(userClubs.slice(i, i + 10));
          }
        });

      unsubscribes.push(userUnsubscribe);

      return () => {
        unsubscribes.forEach(unsub => unsub());
      };
    }
  }, [user]);

  const currentDate = moment().format('YYYY-MM-DD');
  const dayLabel = moment().format('dddd'); // Get the current day name
  const dateLabel = moment().format('MMMM D, YYYY'); // Get the current date
  return (
    <SafeAreaView style={styles.container}>
      <View style={{height: 1, backgroundColor: '#FFFFFF'}} />
      <View
        style={{
          padding: 10,
          backgroundColor: 'white',
          height: 130,
        }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#415B8D',
            marginTop: 50,
          }}>
          {dayLabel}
        </Text>
        <View
          style={{height: 1, backgroundColor: '#415B8D', marginVertical: 1}}
        />
        <Text style={{fontSize: 21, color: '#415B8D'}}>{dateLabel}</Text>
      </View>

      <Agenda
        items={events}
        renderItem={item => (
          <View style={styles.item}>
            <Text>{item.name}</Text>
          </View>
        )}
        renderEmptyData={() => (
          <View style={styles.emptyData}>
            <Text>There are no events today.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFA',
    marginTop: -50,
  },
  item: {
    backgroundColor: 'white',
    flex: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
  },
  emptyData: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CalendarScreen;
