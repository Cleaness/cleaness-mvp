import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function clean(s) {
  return String(s ?? "").trim().replace(/^"|"$/g, "");
}

function splitName(full) {
  const parts = clean(full).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "—" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.slice(-1)[0] };
}

function normalizePhone(raw, id) {
  const v = clean(raw);
  // Viele Einträge haben "0" oder leer. Wir erzeugen dann eine eindeutige Platzhalter-Nummer.
  const digits = v.replace(/[^\d+]/g, "");
  if (!digits || digits === "0") {
    // eindeutiger Platzhalter, der nicht mit echten Nummern kollidiert
    return `999${String(id).padStart(8, "0")}`;
  }
  return digits;
}

function isEmail(v) {
  v = clean(v);
  return v.includes("@") && v.includes(".");
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Bitte CSV-Datei angeben, z.B.: node import-cleaness.js Kundestamm_Cleaness.csv");
    process.exit(1);
  }

  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

  let created = 0, updated = 0, skipped = 0;

  for (const line of lines) {
    // Erwartetes Muster: ;ID;Name;Email;Telefon;Adresse;...
    const cols = line.split(";").map(clean);

    // leere Header-Zeilen wie ;;;;;; überspringen
    const allEmpty = cols.every((c) => !c);
    if (allEmpty) { skipped++; continue; }

    const id = cols[1] ? Number(cols[1]) : NaN;
    const fullName = cols[2] || "";
    const emailRaw = cols[3] || "";
    const phoneRaw = cols[4] || "";
    const address = cols[5] || "";

    if (!fullName || !Number.isFinite(id)) { skipped++; continue; }

    const { firstName, lastName } = splitName(fullName);
    const phone = normalizePhone(phoneRaw, id);
    const email = isEmail(emailRaw) ? emailRaw : null;

    const notesParts = [];
    if (address && address !== "0") notesParts.push(address);
    notesParts.push(`Import-ID: ${id}`);
    const notes = notesParts.join(" | ");

    const existing = await prisma.customer.findUnique({ where: { phone } });

    if (!existing) {
      await prisma.customer.create({
        data: { firstName, lastName, phone, email, notes },
      });
      created++;
    } else {
      await prisma.customer.update({
        where: { phone },
        data: {
          firstName,
          lastName,
          email: email || existing.email,
          notes: existing.notes || notes,
        },
      });
      updated++;
    }
  }

  console.log("Import fertig:", { created, updated, skipped });
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
