import { getDoc, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { signInAnonymously } from 'firebase/auth'

import { Agent } from './types'
import { CollectionName } from './utils'

import { firestore, auth } from './firebase'

interface LoginPayload {
    firstName: string
    lastName: string
    image?: string
    tags: string[]
}
interface CreateAgentPayload {
    id: string
    firstName: string
    lastName: string
    image?: string
    tags: string[]
}

export const login = async (payload: LoginPayload): Promise<Agent> => {
    const credentials = await signInAnonymously(auth)
    const user = await createAgent({ id: credentials.user.uid, ...payload })
    return user
}

export const createAgent = async (payload: CreateAgentPayload): Promise<Agent> => {
    const agent: Agent = {
        id: payload.id,
        first_name: payload.firstName,
        last_name: payload.lastName,
        image: payload.image || null,
        tags: payload.tags,
        created_at: serverTimestamp() as Timestamp,
    }
    await setDoc(doc(firestore, CollectionName.AGENTS, payload.id), agent)
    return agent
}

export const getAgent = async (agentId: string): Promise<Agent> => {
    const snapshot = await getDoc(doc(firestore, CollectionName.AGENTS, agentId))
    return snapshot.data() as Agent
}
