import { createRepository, getCoopDb } from "@/db";
import type { LocalUser } from "@/types";

/** `local_users` has `created_at` but no `updated_at` column. */
const usersRepo = createRepository<LocalUser>("local_users", { updatedAt: false });

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
  const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
  const pinHash = await hashPin(input.pin);
  const recoveryAnswerHash = input.recoveryAnswer ? await hashPin(input.recoveryAnswer) : null;

  await usersRepo.insert(id, {
    name: input.name.trim(),
    role: input.role,
    pin_hash: pinHash,
    recovery_question: input.recoveryQuestion || null,
    recovery_answer_hash: recoveryAnswerHash,
  });

  const rows = await usersRepo.select<LocalUser[]>("SELECT * FROM local_users WHERE id = ?", [id]);
  if (rows.length === 0) throw new Error("Failed to verify user creation.");
  return rows[0];
}

export async function getUsersByCooperativeId(_cooperativeId: string): Promise<LocalUser[]> {
  // `local_users` lives in the active cooperative's DB file, so the repo
  // already scopes to the requested cooperative.
  return usersRepo.list();
}

export async function getUserById(userId: string): Promise<LocalUser | null> {
  const rows = await usersRepo.select<LocalUser[]>("SELECT * FROM local_users WHERE id = ?", [userId]);
  return rows.length > 0 ? rows[0] : null;
}

export interface UpdateUserInput {
  name?: string;
  role?: "admin" | "operator" | "pengawas";
  pin?: string;
  recoveryQuestion?: string;
  recoveryAnswer?: string;
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<LocalUser> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.role !== undefined) patch.role = input.role;
  if (input.pin !== undefined && input.pin.length > 0) patch.pin_hash = await hashPin(input.pin);
  if (input.recoveryQuestion !== undefined) patch.recovery_question = input.recoveryQuestion.trim() || null;
  if (input.recoveryAnswer !== undefined)
    patch.recovery_answer_hash = input.recoveryAnswer.trim() ? await hashPin(input.recoveryAnswer) : null;

  if (Object.keys(patch).length > 0) {
    await usersRepo.update(userId, patch);
  }
  const updated = await getUserById(userId);
  if (!updated) throw new Error("User not found");
  return updated;
}

export async function validatePin(cooperativeId: string, userId: string, pin: string): Promise<LocalUser | null> {
  const db = await getCoopDb(cooperativeId);
  const rows = await db.select<LocalUser[]>("SELECT * FROM local_users WHERE id = ?", [userId]);
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
  await usersRepo.remove(userId);
}
