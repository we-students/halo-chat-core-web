import { getFirestore, getDoc, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { Agent } from './types'
import { CollectionName } from './utils'

const firestoreDB = getFirestore()

interface CreateAgentPayload {
    id: string
    firstName: string
    lastName: string
    image?: string
    tags: string[]
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
    await setDoc(doc(firestoreDB, CollectionName.AGENTS, payload.id), agent)
    return agent
}

export const getAgent = async (agentId: string): Promise<Agent> => {
    const snapshot = await getDoc(doc(firestoreDB, CollectionName.AGENTS, agentId))
    return snapshot.data() as Agent
}
