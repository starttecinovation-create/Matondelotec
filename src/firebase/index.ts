'use client';

import firebaseConfig from '../../firebase-applet-config.json';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Inicialização resiliente do Firebase para ambiente de host.
 * Evita o Erro 104 e crashes de build ao lidar com chaves em falta de forma silenciosa.
 */
export function initializeFirebase() {
  const apiKey = firebaseConfig.apiKey;
  const hasValidKey = !!apiKey && apiKey !== 'undefined' && apiKey !== '';

  if (!hasValidKey) {
    if (typeof window !== 'undefined') {
      console.warn("Firebase: Configuração pendente ou inválida. O SDK está em modo de segurança.");
    }
    return { firebaseApp: null, auth: null, firestore: null };
  }

  try {
    let app: FirebaseApp;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
    };
  } catch (error) {
    console.error("Erro crítico na inicialização do Firebase:", error);
    return { firebaseApp: null, auth: null, firestore: null };
  }
}

export function getSdks() {
  return initializeFirebase();
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
