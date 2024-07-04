import React from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Linking} from 'react-native';

const SettingsScreen = () => {
  const onLogout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Failed to sign out.', error);
    }
  };

  const handleSupport = () => {
    Linking.openURL('https://sites.google.com/view/academate/support');
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const user = auth().currentUser;
              if (user) {
                // Delete user data from Firestore
                await firestore()
                  .collection('users')
                  .doc(user.uid)
                  .delete()
                  .then(() => {
                    console.log('Document successfully deleted!');
                  })
                  .catch(error => {
                    console.error('Error removing document: ', error);
                  });

                // Delete the Firebase Authentication user
                await user.delete();
              }
            } catch (error) {
              console.error('Failed to delete account.', error);
              // Show re-login prompt if an error occurs
              Alert.alert(
                'Authentication Error',
                'Please re-login to delete your account.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Redirect to login screen or initiate re-login
                    },
                  },
                ],
                {
                  cancelable: false,
                },
              );
            }
          },
          style: 'destructive',
        },
      ],
      {
        cancelable: true,
      },
    );
  };

  const handleTermsOfUse = () => {
    Alert.alert(
      'Terms of Use\n',
      "By downloading or using the Academate app, these terms will automatically apply to you \u2013 you should make sure to read them carefully before using the app.\n\nLicense Grant and Restrictions\n\nYou're not allowed to copy or modify the app, any part of the app, or our trademarks in any way. You're not allowed to attempt to extract the source code of the app, and you also shouldn't try to translate the app into other languages or make derivative versions. The app itself, and all the trademarks, copyright, database rights, and other intellectual property rights related to it, still belong to Joseph K. Acquah.\n\nUpdates, Changes, and Payment for Services\n\nJoseph K. Acquah is committed to ensuring that the app is as useful and efficient as possible. For that reason, we reserve the right to make changes to the app or to charge for its services, at any time and for any reason. We will never charge you for the app or its services without making it very clear to you exactly what you're paying for.\n\nData Storage and Security\n\nThe Academate app stores and processes personal data that you have provided to us, to provide our Service. It's your responsibility to keep your phone and access to the app secure. We therefore recommend that you do not jailbreak or root your phone, which is the process of removing software restrictions and limitations imposed by the official operating system of your device. Doing so could make your phone vulnerable to malware/viruses/malicious programs, compromise your phone's security features, and it could mean that the Academate app won't work properly or at all.\n\nThird-Party Services\n\nThe app uses third-party services such as Google Analytics for Firebase and Firebase Crashlytics. Their Terms and Conditions may apply to your use of the app. Please refer to the respective third-party providers' websites for their Terms and Conditions.\n\nInternet Connectivity and Usage Charges\n\nYou should be aware that certain functions of the app will require the app to have an active internet connection, either via Wi-Fi or through your mobile network provider. Joseph K. Acquah cannot take responsibility for the app not working at full functionality if you don't have access to Wi-Fi, and you don't have any of your data allowance left. Also, be mindful of any roaming data charges if you use the app outside of your home territory without turning off data roaming.\n\nDevice Maintenance and Battery Life\n\nAlong the same lines, Joseph K. Acquah cannot always take responsibility for the way you use the app i.e., you need to make sure that your device stays charged \u2013 if it runs out of battery and you can't turn it on to avail the Service, Joseph K. Acquah cannot accept responsibility.\n\nLiability\n\nWith respect to Joseph K. Acquah\u2019s responsibility for your use of the app, when you're using the app, it's important to bear in mind that although we endeavor to ensure that it is updated and correct at all times, we do rely on third parties to provide information to us so that we can make it available to you. Joseph K. Acquah accepts no liability for any loss, direct or indirect, you experience as a result of relying wholly on this functionality of the app.\n\nNo Tolerance for Objectionable Content or Abusive Users\n\nWe have zero tolerance for objectionable content or abusive users. Any user found posting objectionable content or engaging in abusive behavior will be immediately banned from using the service. We reserve the right to determine what constitutes objectionable content and abusive behavior.\n\nUpdates, Termination, and Availability\n\nAt some point, we may wish to update the app or stop providing it altogether. The app is currently available on iOS \u2013 the requirements for the system may change, and you'll need to download the updates if you want to keep using the app. However, you promise to always accept updates to the application when offered to you. Upon any termination, the rights and licenses granted to you in these terms will end, and you must stop using the app, and delete it from your device.\n\nChanges to These Terms and Conditions\n\nWe may update our Terms and Conditions from time to time. Thus, you are advised to review this page periodically for any changes. We will notify you of any changes by posting the new Terms and Conditions on this page.\n\nContact Us\n\nIf you have any questions or suggestions about our Terms and Conditions, do not hesitate to contact us at joeacq72@gmail.com.\n\nThese terms and conditions are effective as of 2023-08-20.\n\nThis Terms and Conditions page was generated by App Privacy Policy Generator",

      [{text: 'OK', onPress: () => console.log('OK Pressed')}],
      {cancelable: false},
    );
  };

  const handleCredits = () => {
    Alert.alert(
      'Credits',
      '<a href="https://www.freepik.com/free-vector/student-club-abstract-concept-illustration-student-organization-university-interest-club-after-school-activity-program-college-association-professional-hobby-society_12145623.htm">Image by vectorjuice</a> on Freepik\n\n' +
        '<a href="https://www.flaticon.com/free-icons/calendar" title="calendar icons">Calendar icons created by Freepik - Flaticon</a>\n\n' +
        '<a href="https://www.flaticon.com/free-icons/home-button" title="home button icons">Home button icons created by Freepik - Flaticon</a>\n\n' +
        '<a href="https://www.flaticon.com/free-icons/people" title="people icons">People icons created by SBTS2018 - Flaticon</a>\n\n' +
        '<a href="https://www.flaticon.com/free-icons/more" title="more icons">More icons created by Kirill Kazachek - Flaticon</a>\n\n' +
        '<a href="https://www.flaticon.com/free-icons/tick" title="tick icons">Tick icons created by Maxim Basinski Premium - Flaticon</a>\n\n' +
        '<a href="https://www.flaticon.com/free-icons/setting" title="setting icons">Setting icons created by Phoenix Group - Flaticon</a>\n\n' +
        '<a href="https://www.freepik.com/free-vector/business-team-putting-together-jigsaw-puzzle-isolated-flat-vector-illustration-cartoon-partners-working-connection-teamwork-partnership-cooperation-concept_10606197.htm#query=group%20illustration&position=4&from_view=search&track=ais">Image by pch.vector</a> on Freepik',
      [{text: 'OK'}],
      {
        cancelable: false,
      },
    );
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'flex-start',
        paddingLeft: 0,
        backgroundColor: 'white',
      }}>
      <Text style={{fontSize: 27, fontWeight: 'bold', marginTop: 55, left: 10}}>
        Settings Screen
      </Text>
      <View
        style={{
          height: 1,
          backgroundColor: '#000',
          width: '110%',
          marginVertical: 28,
        }}
      />
      <TouchableOpacity
        onPress={handleTermsOfUse}
        style={{
          top: 10,
          left: 6,
          borderRadius: 0,
          marginTop: -32,
        }}>
        <Text style={{color: 'black', fontSize: 18}}>Terms of Use</Text>
      </TouchableOpacity>
      <View
        style={{
          height: 1,
          backgroundColor: '#000',
          width: '100%',
          marginVertical: 21,
        }}
      />
      <TouchableOpacity
        onPress={handleCredits}
        style={{padding: 0, marginTop: -25}}>
        <Text style={{color: 'black', fontSize: 18, left: 8, top: 10}}>
          Credits
        </Text>
      </TouchableOpacity>
      <View
        style={{
          height: 1,
          backgroundColor: '#000',
          width: '100%',
          marginVertical: 19,
        }}
      />
      <TouchableOpacity
        onPress={handleSupport}
        style={{padding: 9, marginTop: -25}}>
        <Text style={{color: 'black', fontSize: 18, left: 0}}>Support?</Text>
      </TouchableOpacity>

      <View
        style={{
          height: 1,
          backgroundColor: '#000',
          width: '110%',
          marginVertical: -1,
        }}
      />
      <TouchableOpacity
        onPress={onDeleteAccount}
        style={{padding: 10, marginTop: -2}}>
        <Text style={{color: 'red', fontSize: 18, left: -1}}>
          Delete Account?
        </Text>
      </TouchableOpacity>
      <View
        style={{
          height: 1,
          backgroundColor: '#000',
          width: '110%',
          marginVertical: '-5',
        }}
      />
      <TouchableOpacity onPress={onLogout} style={{padding: 10, marginTop: -4}}>
        <Text style={{color: 'red', fontSize: 18}}>Log Out</Text>
      </TouchableOpacity>
      <View
        style={{
          height: 1,
          backgroundColor: '#000',
          width: '110%',
          marginVertical: -2,
        }}
      />
    </View>
  );
};

export default SettingsScreen;
