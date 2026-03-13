import { db } from '@/config/firebase';
import { router } from 'expo-router';
import { UserCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export async function redirectAfterSignIn(userCredentials: UserCredential) {
  const userDocRef = doc(db, 'users', userCredentials.user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    console.log(userData.completed_onboarding);
    if (userData.completed_onboarding) {
      console.log('succesful sign in. redirecting to main app');
      return router.replace('/(tabs)');
    } else {
      console.log('succesful sign in. redirecting to onboarding');
      return router.replace('/(onboarding)');
    }
  } else {
    throw new Error(
      'This user does not have a profile. Please create a new account',
    );
  }
}
