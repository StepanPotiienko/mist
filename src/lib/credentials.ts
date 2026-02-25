import { db } from "./db"
import { encrypt, decrypt } from "./crypto"

type ServiceKey = "notion" | "google" | "apple" | "obsidian"

export async function saveCredential(service: ServiceKey, data: Record<string, string>): Promise<void> {
  const encrypted = encrypt(JSON.stringify(data))
  await db.credential.upsert({
    where: { service },
    create: { service, data: encrypted },
    update: { data: encrypted },
  })
}

export async function getCredential(service: ServiceKey): Promise<Record<string, string> | null> {
  const row = await db.credential.findUnique({ where: { service } })
  if (!row) return null
  try {
    const decrypted = decrypt(row.data)
    return JSON.parse(decrypted) as Record<string, string>
  } catch (err) {
    console.error(`Failed to load credential for ${service}:`, err)
    // If we get a SyntaxError or other issue, return null to at least not crash the app
    return null
  }
}

export async function deleteCredential(service: ServiceKey): Promise<void> {
  await db.credential.deleteMany({ where: { service } })
}

export async function hasCredential(service: ServiceKey): Promise<boolean> {
  const count = await db.credential.count({ where: { service } })
  return count > 0
}
