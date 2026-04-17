const crypto = await import("crypto");

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;

function getKey(hex) {
  return Buffer.from(hex.slice(0, KEY_LENGTH * 2), "hex");
}

function encrypt(plaintext, hexKey) {
  const key = getKey(hexKey);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

function decrypt(ciphertext, hexKey) {
  const key = getKey(hexKey);
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid ciphertext format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

const key = "aa7ce4da9f49a72f803f5be911be07213666cc42134b6fb23e26b3537c4de563";
const data = JSON.stringify({
  username: "test@example.com",
  password: "password123",
});

try {
  console.log("Original:", data);
  const enc = encrypt(data, key);
  console.log("Encrypted:", enc);
  const dec = decrypt(enc, key);
  console.log("Decrypted:", dec);
  if (dec === data) {
    console.log("SUCCESS");
  } else {
    console.log("FAILURE: mismatch");
  }
} catch (e) {
  console.log(e.name + ": " + e.message);
}
