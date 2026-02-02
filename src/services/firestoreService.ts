import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase';
import type { Chat, Memory } from '@/types';

export interface UserData {
    preferences: {
        apiKeys: Record<string, string>;
        promptMode: string;
        memoryEnabled: boolean;
        currentProviderId: string | null;
        currentModelId: string | null;
    };
    chats: Chat[];
    memories: Memory[];
}

const USERS_COLLECTION = 'users';

/**
 * Save entire user data to Firestore
 */
export async function saveUserData(userId: string, data: Partial<UserData>): Promise<void> {
    try {
        const userRef = doc(firestoreDb, USERS_COLLECTION, userId);
        await setDoc(userRef, data, { merge: true });
        console.log('[Firestore] User data saved');
    } catch (error) {
        console.error('[Firestore] Error saving user data:', error);
        throw error;
    }
}

/**
 * Load user data from Firestore
 */
export async function loadUserData(userId: string): Promise<UserData | null> {
    try {
        const userRef = doc(firestoreDb, USERS_COLLECTION, userId);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
            console.log('[Firestore] User data loaded');
            return snapshot.data() as UserData;
        }

        console.log('[Firestore] No existing user data found');
        return null;
    } catch (error) {
        console.error('[Firestore] Error loading user data:', error);
        return null;
    }
}

/**
 * Sync preferences only
 */
export async function syncPreferences(
    userId: string,
    preferences: UserData['preferences']
): Promise<void> {
    await saveUserData(userId, { preferences });
}

/**
 * Sync chats only
 */
export async function syncChats(userId: string, chats: Chat[]): Promise<void> {
    await saveUserData(userId, { chats });
}

/**
 * Sync memories only
 */
export async function syncMemories(userId: string, memories: Memory[]): Promise<void> {
    await saveUserData(userId, { memories });
}
