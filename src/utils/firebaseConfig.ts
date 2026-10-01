/**
 * Firebase Realtime & Database Configuration
 * If you wish to connect your own external Firebase project, you can paste your credentials here.
 * The game automatically falls back to our high-speed WebSockets and server relay if not configured.
 */

export interface FirebaseClientConfig {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export const customFirebaseConfig: FirebaseClientConfig = {
  // [YAHAN APNA FIREBASE CONFIG PASTE KARO]:
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
