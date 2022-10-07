import { initializeApp, FirebaseApp, FirebaseOptions } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'
import { getStorage, FirebaseStorage } from 'firebase/storage'

class FirebaseInstance {
    private static instance: FirebaseInstance

    private app?: FirebaseApp
    public auth?: Auth
    public firestore?: Firestore
    public storage?: FirebaseStorage

    constructor() {
        if (!FirebaseInstance.instance) {
            FirebaseInstance.instance = this
        }
    }

    public static getInstance(): FirebaseInstance {
        if (!FirebaseInstance.instance) throw new Error('Firebase not initialized yer')
        return FirebaseInstance.instance
    }

    public init(firebaseConfig: FirebaseOptions): void {
        FirebaseInstance.instance.app = initializeApp(firebaseConfig)
        FirebaseInstance.instance.auth = getAuth(FirebaseInstance.instance.app)
        FirebaseInstance.instance.firestore = getFirestore(FirebaseInstance.instance.app)
        FirebaseInstance.instance.storage = getStorage(FirebaseInstance.instance.app)
    }
}

const firebase = new FirebaseInstance()

const initializeChat = (config: FirebaseOptions): void => {
    firebase.init(config)
}

export { initializeChat }
export default firebase
