// IndexedDB Database Layer
import type { Chat, Message, Memory } from './types';

const DB_NAME = 'NexusAI';
const DB_VERSION = 2;

let db: IDBDatabase | null = null;

export async function initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };

        request.onupgradeneeded = (e) => {
            const database = (e.target as IDBOpenDBRequest).result;

            if (!database.objectStoreNames.contains('chats')) {
                const store = database.createObjectStore('chats', { keyPath: 'id' });
                store.createIndex('updatedAt', 'updatedAt');
            }

            if (!database.objectStoreNames.contains('messages')) {
                const store = database.createObjectStore('messages', { keyPath: 'id' });
                store.createIndex('chatId', 'chatId');
            }

            if (!database.objectStoreNames.contains('memories')) {
                const store = database.createObjectStore('memories', { keyPath: 'id' });
                store.createIndex('type', 'type');
                store.createIndex('enabled', 'enabled');
            }
        };
    });
}

async function getStore(name: string, mode: IDBTransactionMode = 'readonly') {
    if (!db) await initDB();
    return db!.transaction(name, mode).objectStore(name);
}

// Chat operations
export async function getAllChats(): Promise<Chat[]> {
    const store = await getStore('chats');
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
            const chats = request.result.sort((a: Chat, b: Chat) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            resolve(chats);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function saveChat(chat: Chat): Promise<void> {
    const store = await getStore('chats', 'readwrite');
    return new Promise((resolve, reject) => {
        const request = store.put({ ...chat, updatedAt: new Date().toISOString() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function deleteChat(id: string): Promise<void> {
    const store = await getStore('chats', 'readwrite');
    await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });

    const messages = await getMessagesByChat(id);
    for (const msg of messages) {
        await deleteMessage(msg.id);
    }
}

// Message operations
export async function getMessagesByChat(chatId: string): Promise<Message[]> {
    const store = await getStore('messages');
    return new Promise((resolve, reject) => {
        const index = store.index('chatId');
        const request = index.getAll(chatId);
        request.onsuccess = () => {
            const msgs = request.result.sort((a: Message, b: Message) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            resolve(msgs);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function saveMessage(message: Message): Promise<void> {
    const store = await getStore('messages', 'readwrite');
    return new Promise((resolve, reject) => {
        const request = store.put(message);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function deleteMessage(id: string): Promise<void> {
    const store = await getStore('messages', 'readwrite');
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Memory operations
export async function getAllMemories(): Promise<Memory[]> {
    const store = await getStore('memories');
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
            const memories = request.result.sort((a: Memory, b: Memory) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            resolve(memories);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function getEnabledMemories(): Promise<Memory[]> {
    const all = await getAllMemories();
    return all.filter(m => m.enabled);
}

export async function saveMemory(memory: Memory): Promise<void> {
    const store = await getStore('memories', 'readwrite');
    return new Promise((resolve, reject) => {
        const request = store.put(memory);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function deleteMemory(id: string): Promise<void> {
    const store = await getStore('memories', 'readwrite');
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function toggleMemoryEnabled(id: string, enabled: boolean): Promise<void> {
    const all = await getAllMemories();
    const memory = all.find(m => m.id === id);
    if (memory) {
        await saveMemory({ ...memory, enabled });
    }
}

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

