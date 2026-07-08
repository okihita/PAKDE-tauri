import { getDb } from "@/db";
import type { LocalUser } from "@/types";

/** Hash a PIN using SHA-256 via Web Crypto API. */
async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface CreateUserInput {
  cooperativeId: string;
  name: string;
  role: "admin" | "operator" | "pengawas";
  pin: string;
  recoveryQuestion?: string;
  recoveryAnswer?: string;
}

export async function createUser(input: CreateUserInput): Promise<LocalUser> {
  const db = await getDb();
  const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
  const pinHash = await hashPin(input.pin);
  const recoveryAnswerHash = input.recoveryAnswer ? await hashPin(input.recoveryAnswer) : null;

  await db.execute(
    `INSERT INTO local_users (id, cooperative_id, name, role, pin_hash, recovery_question, recovery_answer_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.cooperativeId,
      input.name.trim(),
      input.role,
      pinHash,
      input.recoveryQuestion || null,
      recoveryAnswerHash,
    ],
  );

  const rows = await db.select<LocalUser[]>("SELECT * FROM local_users WHERE id = ?", [id]);
  if (rows.length === 0) throw new Error("Failed to verify user creation.");
  return rows[0];
}

export async function getUsersByCooperativeId(cooperativeId: string): Promise<LocalUser[]> {
  const db = await getDb();
  return db.select<LocalUser[]>("SELECT * FROM local_users WHERE cooperative_id = ?", [cooperativeId]);
}

export async function getUserById(userId: string): Promise<LocalUser | null> {
  const db = await getDb();
  const rows = await db.select<LocalUser[]>("SELECT * FROM local_users WHERE id = ?", [userId]);
  return rows.length > 0 ? rows[0] : null;
}

export async function validatePin(cooperativeId: string, userId: string, pin: string): Promise<LocalUser | null> {
  const db = await getDb();
  const rows = await db.select<LocalUser[]>("SELECT * FROM local_users WHERE id = ? AND cooperative_id = ?", [
    userId,
    cooperativeId,
  ]);
  if (rows.length === 0) return null;

  const user = rows[0];

  // Check lockout
  if (user.locked_until) {
    const lockedTime = new Date(user.locked_until).getTime();
    if (Date.now() < lockedTime) {
      throw new Error("Akun terkunci karena terlalu banyak percobaan gagal. Silakan coba lagi nanti.");
    }
    // Lock expired — reset
    await db.execute("UPDATE local_users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", [userId]);
    user.failed_attempts = 0;
    user.locked_until = undefined;
  }

  const pinHash = await hashPin(pin);
  if (pinHash !== user.pin_hash) {
    const attempts = (user.failed_attempts || 0) + 1;
    if (attempts >= 3) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min lockout
      await db.execute("UPDATE local_users SET failed_attempts = ?, locked_until = ? WHERE id = ?", [
        attempts,
        lockUntil,
        userId,
      ]);
      throw new Error("PIN salah 3 kali. Akun terkunci selama 15 menit.");
    }
    await db.execute("UPDATE local_users SET failed_attempts = ? WHERE id = ?", [attempts, userId]);
    return null;
  }

  // Reset attempts on success
  await db.execute("UPDATE local_users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", [userId]);
  return user;
}

export async function deleteUser(userId: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM local_users WHERE id = ?", [userId]);
}
