import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function clean(s) {
  return String(s ?? "").trim().replace(/^"|"$/g, "");
}

function detectDelimiter(headerLine) {
  if (headerLine.includes(";")) return ";";
  if (headerLine.includes(",")) return ",";
  return ";";
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Bitte CSV-Datei angeben, z.B.: node import-customers.js Kundestamm_Cleaness.csv");
    process.exit(1);
  }

  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const delim = detectDelimiter(lines[0]);
  const header = lines[0].split(delim).map(clean);

  const col = (name) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const iFirst = col("Vorname");
  const iLast  = col("Nachname");
  const iPhone = col("Telefon");
  const iEmail = col("Email");
  const iNotes = col("Notiz");

  if (iPhone === -1 || iFirst === -1 || iLast === -1) {
    console.error("CSV-Header muss mindestens Vorname, Nachname, Telefon enthalten.");
    console.error("Gefundene Header:", header.join(" | "));
    process.exit(1);
  }

  let created = 0, updated = 0, skipped = 0;

  for (let n = 1; n < lines.length; n++) {
    const row = lines[n].split(delim).map(clean);

    const firstName = clean(row[iFirst]);
    const lastName  = clean(row[iLast]);
    const phone     = clean(row[iPhone]);
    const email     = iEmail !== -1 ? clean(row[iEmail]) : "";
    const notes     = iNotes !== -1 ? clean(row[iNotes]) : "";

    if (!firstName || !lastName || !phone) {
      skipped++;
      continue;
    }

    const existing = await prisma.customer.findUnique({ where: { phone } });

    if (!existing) {
      await prisma.customer.create({
        data: { firstName, lastName, phone, email: email || null, notes: notes || null },
      });
      created++;
    } else {
      await prisma.customer.update({
        where: { phone },
        data: {
          firstName,
          lastName,
          email: email || existing.email,
          notes: notes || existing.notes,
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
