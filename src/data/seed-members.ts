// Generates mock Indonesian cooperative members for testing.
import { getCoopDb } from "@/db";
import { DEMO_COOP_UUID } from "@/db/seed-demo";

const FIRST_NAMES_MALE = [
  "Sutrisno",
  "Bambang",
  "Agus",
  "Hendro",
  "Supri",
  "Joko",
  "Eko",
  "Rudi",
  "Anton",
  "Budi",
  "Andi",
  "Rizki",
  "Dedi",
  "Imam",
  "Fajar",
  "Tono",
  "Wawan",
  "Slamet",
  "Kusnadi",
  "Poniran",
  "Sukirman",
  "Wagiman",
  "Paiman",
  "Sugeng",
  "Darmanto",
];

const FIRST_NAMES_FEMALE = [
  "Sumarni",
  "Siti",
  "Dewi",
  "Rini",
  "Yanti",
  "Nurul",
  "Fitri",
  "Ratna",
  "Wati",
  "Endang",
  "Sulastri",
  "Sri",
  "Indah",
  "Lestari",
  "Kartini",
  "Tutik",
  "Yuli",
  "Anik",
  "Sukesi",
  "Murni",
  "Rukmini",
  "Partini",
  "Mira",
  "Rina",
  "Lina",
];

const LAST_NAMES = [
  "Santoso",
  "Wijaya",
  "Susanto",
  "Hartono",
  "Wahyudi",
  "Prasetyo",
  "Rahmawati",
  "Kusuma",
  "Utomo",
  "Haryanto",
  "Wibowo",
  "Purnomo",
  "Saputra",
  "Hidayat",
  "Nugroho",
  "Gunawan",
  "Kurniawan",
  "Mahendra",
  "Pamungkas",
  "Setiawan",
];

const OCCUPATIONS = [
  "Petani",
  "Pedagang",
  "Nelayan",
  "Buruh Tani",
  "Penjahit",
  "Guru",
  "Sopir",
  "Tukang Kayu",
  "Tukang Batu",
  "Wiraswasta",
  "Peternak",
  "Penjual Sayur",
  "Pengrajin",
  "Karyawan Swasta",
  "PNS",
  "Bidan",
  "Perawat",
];

const EDUCATIONS = ["SD", "SMP", "SMA", "SMK", "D3", "S1", "S2", "Tidak Sekolah", "Paket C"];

const VILLAGES = [
  "Dusun Krajan",
  "Dusun Wonosari",
  "Dusun Sumberejo",
  "Dusun Sidomulyo",
  "Dusun Ngemplak",
  "Dusun Karanganyar",
  "Dusun Gedangan",
];

const LOAN_STATUSES = ["lancar", "lancar", "lancar", "lancar", "macet", "diragukan"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/** Seed 50 mock members into the database. */
export async function seedMockMembers(): Promise<number> {
  const db = await getCoopDb(DEMO_COOP_UUID);

  // Clear existing test members (those with id starting with "seed-")
  await db.execute("DELETE FROM members WHERE id LIKE 'seed-%'");

  const members: Array<{
    id: string;
    nik: string;
    name: string;
    place_of_birth: string;
    date_of_birth: string;
    gender: "L" | "P";
    occupation: string;
    education: string;
    rt: string;
    rw: string;
    hamlet: string;
    status: "aktif" | "nonaktif";
    savings_pokok: number;
    savings_wajib: number;
    savings_sukarela: number;
    loan_total: number;
    loan_outstanding: number;
    loan_status: string;
  }> = [];

  for (let i = 1; i <= 50; i++) {
    const gender = Math.random() > 0.4 ? "L" : "P";
    const firstList = gender === "L" ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
    const firstName = pick(firstList);
    const lastName = pick(LAST_NAMES);
    const age = rand(22, 65);
    const birthYear = 2026 - age;
    const birthMonth = rand(1, 12);
    const birthDay = rand(1, 28);

    const savingsPokok = 100000 * rand(1, 5); // 100k–500k
    const savingsWajib = 50000 * rand(0, 20); // 0–1M
    const savingsSukarela = rand(0, 1) ? 0 : 100000 * rand(1, 30); // 0 or 100k–3M
    const hasLoan = Math.random() > 0.5;
    const loanTotal = hasLoan ? 1000000 * rand(1, 20) : 0; // 1M–20M
    const loanOutstanding = hasLoan ? Math.floor(loanTotal * (rand(10, 100) / 100)) : 0;

    members.push({
      id: `seed-${pad(i, 3)}`,
      nik: `35${pad(rand(1, 99), 2)}${pad(rand(100000, 999999), 6)}${pad(i, 4)}`,
      name: `${firstName} ${lastName}`,
      place_of_birth: pick(["Mojokerto", "Jombang", "Kediri", "Surabaya", "Malang", "Nganjuk"]),
      date_of_birth: `${birthYear}-${pad(birthMonth, 2)}-${pad(birthDay, 2)}`,
      gender,
      occupation: pick(OCCUPATIONS),
      education: pick(EDUCATIONS),
      rt: pad(rand(1, 5), 2),
      rw: pad(rand(1, 3), 2),
      hamlet: pick(VILLAGES),
      status: Math.random() > 0.1 ? "aktif" : "nonaktif",
      savings_pokok: savingsPokok,
      savings_wajib: savingsWajib,
      savings_sukarela: savingsSukarela,
      loan_total: loanTotal,
      loan_outstanding: loanOutstanding,
      loan_status: hasLoan && loanOutstanding > 0 ? pick(LOAN_STATUSES) : "lancar",
    });
  }

  for (const m of members) {
    await db.execute(
      `INSERT INTO members (id, nik, name, place_of_birth, date_of_birth, gender,
        occupation, education, rt, rw, hamlet, status, savings_pokok, savings_wajib,
        savings_sukarela, loan_total, loan_outstanding, loan_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        m.id,
        m.nik,
        m.name,
        m.place_of_birth,
        m.date_of_birth,
        m.gender,
        m.occupation,
        m.education,
        m.rt,
        m.rw,
        m.hamlet,
        m.status,
        m.savings_pokok,
        m.savings_wajib,
        m.savings_sukarela,
        m.loan_total,
        m.loan_outstanding,
        m.loan_status,
      ],
    );
  }

  return members.length;
}
