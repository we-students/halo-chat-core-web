import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    Timestamp,
    onSnapshot,
    updateDoc,
    where,
    query,
    getDocs,
    runTransaction,
    deleteDoc,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage, ref, uploadBytes } from 'firebase/storage'
import { getUser } from './user'
import { Agent, MessageType, Room, User } from './types'
import { CollectionName, MessageTypeEmoji, userToPreview } from './utils'
import { getAgent } from './agent'

const auth = getAuth()
const firestoreDB = getFirestore()
const storage = getStorage()

export const createRoomWithUsers = async (users: User[], name?: string): Promise<Room> => {
    const currentFirebaseUser = auth.currentUser
    if (currentFirebaseUser === null) throw new Error('createRoomWithUsers: Firebase user not authenticated')
    const creator = await getUser(currentFirebaseUser.uid)
    if (creator === null) throw new Error('createRoomWithUsers: user not exists')
    if (users.length === 0) throw new Error('createRoomWithUsers: no users selected')

    // if room is private, check if already exists
    if (users.length === 1) {
        const snapshot = await getDocs(
            query(
                collection(firestoreDB, CollectionName.ROOMS),
                where('scope', '==', 'PRIVATE'),
                where('users_ids', 'array-contains', currentFirebaseUser.uid),
            ),
        )

        const existingRoom = snapshot.docs.find((d) => (d.data() as Room).users.some((u) => u.id === users[0]?.id))
        if (existingRoom) return existingRoom.data() as Room
    }

    const docRef = doc(firestoreDB, CollectionName.ROOMS)

    const room: Room = {
        id: docRef.id,
        created_at: serverTimestamp() as Timestamp,
        created_by: creator.id,
        users: [userToPreview(creator), ...users.map((u) => userToPreview(u))],
        users_ids: [creator.id, ...users.map((u) => u.id)],
        scope: users.length > 1 ? 'GROUP' : 'PRIVATE',
        tag: null,
        name: name || null,
        last_message: null,
        agent: null,
    }

    await setDoc(docRef, room)

    return room
}

export const createRoomWithAgent = async (tag: string): Promise<Room> => {
    const currentFirebaseUser = auth.currentUser
    if (currentFirebaseUser === null) throw new Error('createRoomWithUsers: Firebase user not authenticated')
    const creator = await getUser(currentFirebaseUser.uid)
    if (creator === null) throw new Error('createRoomWithUsers: user not exists')

    const docRef = doc(firestoreDB, CollectionName.ROOMS)

    const room: Room = {
        id: docRef.id,
        created_at: serverTimestamp() as Timestamp,
        created_by: creator.id,
        users: [userToPreview(creator)],
        users_ids: [creator.id],
        scope: 'AGENT',
        tag,
        name: null,
        last_message: null,
        agent: null,
    }
    await setDoc(docRef, room)
    return room
}

export const joinAgent = async (roomId: string): Promise<Room> => {
    const currentFirebaseUser = auth.currentUser
    if (currentFirebaseUser === null) throw new Error('createRoomWithUsers: Firebase user not authenticated')

    const agent = await getAgent(currentFirebaseUser.uid)
    if (agent === null) throw new Error('joinAgent: agent not exists')

    await updateDoc(doc(firestoreDB, CollectionName.ROOMS, roomId), {
        agent: {
            id: agent.id,
            first_name: agent.first_name,
            last_name: agent.last_name,
            image: agent.image,
        },
    })

    const res = await getDoc(doc(firestoreDB, CollectionName.ROOMS, roomId))
    return res.data() as Room
}

export const fetchRooms = (onRoomsUpdate: (rooms: Room[]) => void, onError: (error: Error) => void): void => {
    const currentFirebaseUser = auth.currentUser
    if (currentFirebaseUser === null) throw new Error('createRoomWithUsers: Firebase user not authenticated')

    onSnapshot(
        query(
            collection(firestoreDB, CollectionName.ROOMS),
            where('users_ids', 'array-contains', currentFirebaseUser.uid),
        ),
        (snapshop) => {
            onRoomsUpdate(snapshop.docs.map((rDoc) => rDoc.data() as Room).filter((r) => r.created_at !== null))
        },
        onError,
    )
}

export const fetchAgentRooms = (
    agent: Agent,
    onRoomsUpdate: (rooms: Room[]) => void,
    onError: (error: Error) => void,
): void => {
    const currentFirebaseUser = auth.currentUser
    if (currentFirebaseUser === null) throw new Error('createRoomWithUsers: Firebase user not authenticated')

    onSnapshot(
        query(
            collection(firestoreDB, CollectionName.ROOMS),
            where('scope', '==', 'AGENT'),
            where('tag', 'in', agent.tags),
        ),
        (snapshop) => {
            onRoomsUpdate(snapshop.docs.map((rDoc) => rDoc.data() as Room).filter((r) => r.created_at !== null))
        },
        onError,
    )
}

const finalizeSendMessage = async (roomId: string, messageData: any): Promise<void> => {
    const roomRef = doc(firestoreDB, CollectionName.ROOMS, roomId)
    const messageRef = doc(collection(roomRef, CollectionName.MESSAGES))
    const message: MessageType.Any = {
        id: messageRef.id,
        ...messageData,
    }

    const messagePreview = {
        id: messageRef.id,
        type: message.content_type,
        text:
            (MessageTypeEmoji[message.content_type] ? MessageTypeEmoji[message.content_type] + ' ' : '') +
            (message.text || ''),
        sent_at: message.created_at,
        sent_by: message.created_by,
    }

    await runTransaction(firestoreDB, async (transaction) => {
        await transaction.set(messageRef, message)
        await transaction.update(roomRef, {
            last_message: messagePreview,
        })
    })
}

export const sendTextMessage = async ({
    roomId,
    text,
    metadata,
}: {
    roomId: string
    text: string
    metadata?: Record<string, any>
}): Promise<void> => {
    const currentFirebaseUser = auth.currentUser
    if (currentFirebaseUser === null) throw new Error('createRoomWithUsers: Firebase user not authenticated')

    const message = {
        text,
        created_by: currentFirebaseUser.uid,
        created_at: serverTimestamp() as Timestamp,
        updated_at: serverTimestamp() as Timestamp,
        metadata: metadata || null,
        room: roomId,
        content_type: 'TEXT',
        delivered: false,
        read: false,
    }

    await finalizeSendMessage(roomId, message)
}

export const sendFileMessage = async ({
    roomId,
    text,
    file,
    metadata,
}: {
    roomId: string
    text?: string
    file: {
        filename: string
        uri: string
        mimeType: string
    }
    metadata?: Record<string, any>
}): Promise<void> => {
    // todo:
    // const currentFirebaseUser = auth.currentUser
    // if (currentFirebaseUser === null) throw new Error('createRoomWithUsers: Firebase user not authenticated')
    // let content_type: 'AUDIO' | 'VIDEO' | 'IMAGE' | 'CUSTOM' = 'CUSTOM'
    // if (file.mimeType.match(/^image\//)) {
    //     content_type = 'IMAGE'
    // } else if (file.mimeType.match(/^video\//)) {
    //     content_type = 'VIDEO'
    // } else if (file.mimeType.match(/^audio\//)) {
    //     content_type = 'AUDIO'
    // }
    // let docPath = file.filename
    // switch (content_type) {
    //     case 'IMAGE':
    //         docPath = `/${roomId}/images/` + docPath
    //         break
    //     case 'VIDEO':
    //         docPath = `/${roomId}/videos/` + docPath
    //         break
    //     case 'AUDIO':
    //         docPath = `/${roomId}/audios/` + docPath
    //         break
    // }
    // const attachmentRef = ref(storage, docPath)
    // const uri = Platform.OS === 'ios' ? file.uri : (await RNFetchBlob.fs.stat(file.uri)).path
    // await attachmentRef.putFile(uri)
    // await uploadBytes(storage, attachmentRef)
    // const message = {
    //     room: roomId,
    //     content_type,
    //     text: text || null,
    //     created_at: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
    //     updated_at: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
    //     created_by: currentFirebaseUser.uid,
    //     file: {
    //         mimeType: file.mimeType,
    //         name: file.filename,
    //         uri: await attachmentRef.getDownloadURL(),
    //     },
    //     delivered: false,
    //     read: false,
    //     metadata: metadata || null,
    // }
    // await finalizeSendMessage(roomId, message)
}

export const sendFileMessageWithUrl = async ({
    roomId,
    text,
    file,
    metadata,
}: {
    roomId: string
    text?: string
    file: {
        filename: string
        url: string
        mimeType: string
    }
    metadata?: Record<string, any>
}): Promise<void> => {
    const currentFirebaseUser = auth.currentUser
    if (currentFirebaseUser === null) throw new Error('createRoomWithUsers: Firebase user not authenticated')

    let content_type: 'AUDIO' | 'VIDEO' | 'IMAGE' | 'CUSTOM' = 'CUSTOM'
    if (file.mimeType.match(/^image\//)) {
        content_type = 'IMAGE'
    } else if (file.mimeType.match(/^video\//)) {
        content_type = 'VIDEO'
    } else if (file.mimeType.match(/^audio\//)) {
        content_type = 'AUDIO'
    }

    const message = {
        room: roomId,
        content_type,
        text: text || null,
        created_at: serverTimestamp() as Timestamp,
        updated_at: serverTimestamp() as Timestamp,
        created_by: currentFirebaseUser.uid,
        file: {
            mimeType: file.mimeType,
            name: file.filename,
            uri: file.url,
        },
        delivered: false,
        read: false,
        metadata: metadata || null,
    }

    await finalizeSendMessage(roomId, message)
}

export const messageDelivered = async (roomId: string, messageId: string): Promise<void> => {
    const roomRef = doc(firestoreDB, CollectionName.ROOMS, roomId)

    await updateDoc(doc(roomRef, CollectionName.MESSAGES, messageId), { delivered: true })
}

export const messageRead = async (roomId: string, messageId: string): Promise<void> => {
    const roomRef = doc(firestoreDB, CollectionName.ROOMS, roomId)

    await updateDoc(doc(roomRef, CollectionName.MESSAGES, messageId), { read: true })
}

export const deleteMessage = async (roomId: string, messageId: string): Promise<void> => {
    const roomRef = doc(firestoreDB, CollectionName.ROOMS, roomId)

    await deleteDoc(doc(roomRef, CollectionName.MESSAGES, messageId))
}

export const fetchMessages = (
    roomId: string,
    onMessagesUpdate: (messages: MessageType.Any[]) => void,
    onError: (error: Error) => void,
): void => {
    const roomRef = doc(firestoreDB, CollectionName.ROOMS, roomId)

    onSnapshot(
        collection(roomRef, CollectionName.MESSAGES),
        (snapshot) =>
            onMessagesUpdate(
                snapshot.docs
                    .map((d) => d.data() as MessageType.Any)
                    .filter((m) => m.created_at !== null)
                    .sort((m1, m2) => m2.created_at.toDate().getTime() - m1.created_at.toDate().getTime()),
            ),
        onError,
    )
}
