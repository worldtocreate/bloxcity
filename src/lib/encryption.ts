// E2E Encryption utilities using Web Crypto API with 4-digit PIN

const SALT = 'bloxcity-dm-salt';
const ITERATIONS = 100000;

// Derive a key from a 4-digit PIN
async function deriveKey(pin: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Hash a PIN for storage (for verification without storing the PIN)
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a random conversation key
export function generateConversationKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes));
}

// Encrypt the conversation key with user's PIN (for storage)
export async function encryptConversationKey(conversationKey: string, pin: string): Promise<{ encrypted: string; iv: string }> {
  const key = await deriveKey(pin);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(conversationKey)
  );
  
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

// Decrypt the conversation key with user's PIN
export async function decryptConversationKey(encrypted: string, iv: string, pin: string): Promise<string> {
  try {
    const key = await deriveKey(pin);
    const decoder = new TextDecoder();
    
    const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      encryptedBytes
    );
    
    return decoder.decode(decrypted);
  } catch {
    throw new Error('Failed to decrypt conversation key. Wrong PIN?');
  }
}

// Derive a key directly from conversation key (not PIN)
async function deriveKeyFromConvoKey(conversationKey: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyBytes = Uint8Array.from(atob(conversationKey), c => c.charCodeAt(0));
  
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a message using the conversation key
export async function encryptMessage(message: string, conversationKey: string): Promise<{ encrypted: string; iv: string }> {
  const key = await deriveKeyFromConvoKey(conversationKey);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(message)
  );
  
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

// Decrypt a message using the conversation key
export async function decryptMessage(encrypted: string, iv: string, conversationKey: string): Promise<string> {
  try {
    const key = await deriveKeyFromConvoKey(conversationKey);
    const decoder = new TextDecoder();
    
    const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      encryptedBytes
    );
    
    return decoder.decode(decrypted);
  } catch {
    throw new Error('Failed to decrypt message.');
  }
}

// Validate PIN format
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
