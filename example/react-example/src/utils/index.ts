import { FirebaseOptions } from "firebase/app"

const firstNames = [
    'Pino',
    'Enrico',
    'Andrea',
    'Fernando',
    'Gabriele',
    'Piero',
    'Giulio',
    'Luigi',
    'Oreste',
    'Peppino'
]
const lastNames = [
    'Giardino',
    'Destefanis',
    'Di Bello',
    'Morabito',
    'Scarcella',
    'Sapino',
    'Nocera',
    'Morelli',
    'Cielo',
    'Francese',
]

export const randomFirstName = (): string => {
    return firstNames[Math.floor(Math.random() * firstNames.length)]!
}

export const randomLastName = (): string => {
    return lastNames[Math.floor(Math.random() * lastNames.length)]!
}

export const getFirebaseConfig = (): FirebaseOptions => {
    return {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID
    }
}