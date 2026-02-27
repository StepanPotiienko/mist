import { db } from "./src/lib/db";
import { decrypt } from "./src/lib/crypto";

async function run() {
  const row = await db.credential.findUnique({ where: { service: "google" } });
  if (!row) {
    console.log("No Google credentials found in DB.");
    process.exit(0);
  }
  try {
    const decrypted = decrypt(row.data);
    const data = JSON.parse(decrypted);
    console.log("Google Credentials found:");
    console.log("Access Token:", data.accessToken ? "Exists" : "Missing");
    console.log("Refresh Token:", data.refreshToken ? "Exists" : "Missing");
    console.log("Expiry Date:", data.expiryDate);
  } catch (err) {
    console.error("Failed to decrypt credentials:", err);
  }
}

run();
