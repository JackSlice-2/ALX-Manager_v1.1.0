
import CryptoJS from 'crypto-js'
import * as Crypto from 'expo-crypto'

const generateSecureIV = async () => {
  const randomBytes = await Crypto.getRandomBytesAsync(16)
  return CryptoJS.lib.WordArray.create(randomBytes as any)
}

export const encryptAES = async (plainText: string, secretKey: string) => {
  // 1️⃣ Derive 32-byte key from secret (same as SHA256 in C# most cases)
  const key = CryptoJS.SHA256(secretKey)

  // 2️⃣ Generate secure IV using Expo
  const iv = await generateSecureIV()

  // 3️⃣ AES-CBC + PKCS7
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })

  // 4️⃣ Combine IV + ciphertext
  const combined = iv.concat(encrypted.ciphertext)

  // 5️⃣ Return Base64
  return CryptoJS.enc.Base64.stringify(combined)
}

export const HOST = '44.211.159.90'
export const PORT = 8091
export const SECRET_KEY = "8UHjPgXZzXCGkhxV2QCnooyJexUzvJrO";

export type TcpClientWrapper = {
  write: (data: string) => Promise<void>
  close: () => Promise<void>
}