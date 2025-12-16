# Cleaness MVP – Kalender + Kundenstamm + Online-Beratung (ohne Zahlung)

Dieses Projekt ist ein minimales, selbst hostbares System für:
- Kundenstamm (Name + Telefon Pflicht, E-Mail optional)
- Leistungstypen (inkl. "Behandlung 30/60/.../300" und benannte Leistungen)
- Terminverwaltung (Konfliktprüfung, blockt Zeiten)
- Online-Buchung nur für "Beratung"

## Voraussetzungen
- Node.js 18+ (empfohlen 20+)
- npm oder pnpm

## Setup
1. In dieses Verzeichnis wechseln
2. Abhängigkeiten installieren:
   - npm install
3. Umgebungsvariablen kopieren:
   - cp .env.example .env
   - ADMIN_PASSWORD setzen
4. Datenbank initialisieren:
   - npx prisma migrate dev --name init
5. Dev-Server starten:
   - npm run dev
6. Öffnen:
   - Admin: http://localhost:3000/admin (Passwort aus .env)
   - Online-Beratung: http://localhost:3000/book/beratung

## Produktion (lokal)
- npm run build
- npm run start

## Hinweise
- Für MVP ist Auth bewusst simpel (ein Admin-Passwort).
- Für Internetbetrieb: HTTPS, Reverse Proxy, Backups, starke Passwörter, ggf. 2FA.
