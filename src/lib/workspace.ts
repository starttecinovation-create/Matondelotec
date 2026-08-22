import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signInWithRedirect } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

// Add Workspace scopes
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/forms.body'
];

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  const { auth } = initializeFirebase();
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If we don't have token but user is logged in, we might need to prompt again or we can just fail silently and require button click
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleWorkspaceSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  const { auth } = initializeFirebase();
  if (!auth) throw new Error("Firebase auth not initialized");

  const provider = new GoogleAuthProvider();
  SCOPES.forEach(scope => provider.addScope(scope));

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getWorkspaceAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutWorkspace = async () => {
  const { auth } = initializeFirebase();
  if (auth) await auth.signOut();
  cachedAccessToken = null;
};
