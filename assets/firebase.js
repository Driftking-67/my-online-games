// Connects the site to Firebase for sign in. If the settings in firebase-config.js
// haven't been filled in yet, accounts are switched off and everything else still works.
import { firebaseConfig } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

export const configured =
  !!firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('PASTE');

let auth = null;
let fb = null;

if (configured) {
  try {
    const { initializeApp } = await import(`${SDK}/firebase-app.js`);
    fb = await import(`${SDK}/firebase-auth.js`);
    auth = fb.getAuth(initializeApp(firebaseConfig));
  } catch (err) {
    console.error('Could not start Firebase:', err);
    auth = null;
  }
}

export { auth, fb };

// Calls back with the signed-in user (or null) now and whenever it changes.
export function watchUser(callback) {
  if (!auth) { callback(null); return () => {}; }
  return fb.onAuthStateChanged(auth, callback);
}

// Turns Firebase error codes into plain words.
export function friendlyError(err) {
  const code = (err && err.code) || '';
  const messages = {
    'auth/invalid-email': 'That email address doesn\'t look right.',
    'auth/missing-email': 'Please enter your email.',
    'auth/missing-password': 'Please enter your password.',
    'auth/email-already-in-use': 'There\'s already an account with that email. Try signing in.',
    'auth/weak-password': 'Please use a password with at least 6 characters.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'Email or password is incorrect.',
    'auth/too-many-requests': 'Too many tries. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Couldn\'t reach the internet. Check your connection.',
    'auth/operation-not-allowed': 'Email sign in isn\'t turned on in Firebase yet.',
    'auth/unauthorized-domain': 'This website isn\'t on Firebase\'s list of allowed domains yet.',
  };
  return messages[code] || 'Something went wrong. Please try again.';
}
