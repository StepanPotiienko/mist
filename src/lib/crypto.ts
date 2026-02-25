import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length < KEY_LENGTH * 2) {
    throw new Error(
      "ENCRYPTION_KEY env var is missing or too short. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    )
  }
  return Buffer.from(hex.slice(0, KEY_LENGTH * 2), "hex")
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  // iv:authTag:encrypted — all hex encoded
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":")
}

export function decrypt(ciphertext: string): string {
  try {
    const key = getKey()
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":")
    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error(`Invalid ciphertext format (parts: ${ciphertext.split(":").length})`)
    }
    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")
    const encrypted = Buffer.from(encryptedHex, "hex")
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])
    return decrypted.toString("utf8")
  } catch (err) {
    console.error("Decryption failed:", err)
    throw err
  }
}
