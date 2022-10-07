import { collection, doc, getDoc, setDoc, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore'
import { signInAnonymously } from 'firebase/auth'

import type { User } from './types'
import { CollectionName } from './utils'

import { firestore, auth } from './firebase'

interface LoginPayload {
    firstName?: string
    lastName?: string
    image?: string
}
interface CreateUserPayload {
    id: string
    firstName?: string
    lastName?: string
    image?: string
}

export const login = async (payload: LoginPayload): Promise<User> => {
    const credentials = await signInAnonymously(auth)
    const user = await createUser({ id: credentials.user.uid, ...payload })
    return user
}

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
    const user: User = {
        id: payload.id,
        first_name: payload.firstName || null,
        last_name: payload.lastName || null,
        image: payload.image || null,
        created_at: serverTimestamp() as Timestamp,
    }

    await setDoc(doc(firestore, CollectionName.USERS, payload.id), user)

    return user
}

export const getUser = async (userId: string): Promise<User> => {
    const docSnap = await getDoc(doc(firestore, CollectionName.USERS, userId))
    return docSnap.data() as User
}

export const fetchUsers = (onUsersUpdate: (users: User[]) => void, onError: (error: Error) => void): void => {
    const collectionRef = collection(firestore, CollectionName.USERS)

    onSnapshot(
        collectionRef,
        (snapshot) => {
            onUsersUpdate(snapshot.docs.map((u) => u.data() as User))
        },
        onError,
    )
}
