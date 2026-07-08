// Cryptographic HMAC-SHA256 Progression Storage for Offline Mode
const SECRET_KEY = "pakde-learning-tech-tree-curriculum-salt-2026";
const STORAGE_KEY = "pakde-learn-progress";

async function generateSignature(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  try {
    const key = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"],
    );
    const signature = await window.crypto.subtle.sign("HMAC", key, enc.encode(data));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (e) {
    console.error("Cryptography error:", e);
    return "";
  }
}

export async function saveProgress(completedLessons: string[]): Promise<void> {
  const dataStr = JSON.stringify(completedLessons);
  const signature = await generateSignature(dataStr, SECRET_KEY);
  const payload = {
    data: completedLessons,
    signature,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function loadProgress(): Promise<string[]> {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    // Default initial unlocked lessons: mod1-0, mod1-1, mod1-2
    return ["mod1-0", "mod1-1", "mod1-2"];
  }

  try {
    const parsed = JSON.parse(saved);
    if (!parsed.data || !parsed.signature) {
      return ["mod1-0", "mod1-1", "mod1-2"];
    }

    const dataStr = JSON.stringify(parsed.data);
    const calculatedSignature = await generateSignature(dataStr, SECRET_KEY);

    if (calculatedSignature !== parsed.signature) {
      console.error("SECURITY ALERT: Local progress file has been tampered with! Resetting progress.");
      return ["mod1-0", "mod1-1", "mod1-2"];
    }

    return parsed.data;
  } catch (e) {
    console.error("Failed to parse local progress:", e);
    return ["mod1-0", "mod1-1", "mod1-2"];
  }
}
