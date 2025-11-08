# ShopChat — QR → Ephemeral In‑Store Chat

**Goal:** Scan a QR, join a temporary chat room for a store/aisle, get help fast — no login/app.

## 🏃 Quickstart (hackathon-speed)
1) Create a Firebase project → enable **Firestore** & **Authentication (Anonymous)**.
2) Copy **.env.local** from example and fill your Firebase web config:
   ```bash
   cp .env.local.example .env.local
   ```
3) Install deps and run:
   ```bash
   npm i
   npm run dev
   ```
   Open http://localhost:3000

4) Create a room from **/dashboard** (e.g., id `demo-aisle7`) and then generate a QR:
   ```bash
   QR_BASE_URL=http://localhost:3000 npm run qr -- --room demo-aisle7
   ```

5) (Optional) Deploy Cloud Functions and seed the demo catalog:
   ```bash
   cd functions && npm i && cd ..
   # Deploy (requires Firebase CLI login): npm run functions:deploy
   # Or seed catalog locally (needs admin creds):
   node scripts/seed_catalog.js
   ```

## 🔐 Firestore Rules
Minimal demo rules are in **firestore.rules**. For production, tighten writes and staff roles.

## 🧠 Features in this scaffold
- Anonymous auth + random handles
- Realtime chat (Firestore)
- Staff broadcast + pinned message
- Basic moderation (Cloud Function + bad-words)
- Simple product-finder bot using a local catalog
- Room TTL + scheduled cleanup
- QR generation script

## 📱 Demo Script (2–3 min)
1. **Hook:** “Help is one QR away.”
2. **Scan QR** → `/join?room=demo-aisle7` → instant entry.
3. Ask: *“Where’s the 27" IPS?”* → HelperBot replies with aisle/shelf.
4. Second device posts a tip: “$199 last week.”
5. **Staff broadcast** from `/dashboard`: pinned coupon banner.
6. Show **room counter** growing on dashboard.
7. **Explain safety:** slur → message is struck and user auto-muted after 3 strikes.
8. **Close:** ephemeral rooms auto-expire → relevant, private, lightweight.

## 📦 Folder Map
- `app/` Next.js routes (Home, Join, Room, Dashboard)
- `components/` Chat UI
- `lib/firebase.js` Client init & auth
- `functions/` Cloud Functions (moderation, bot, cleanup, analytics)
- `catalog/` Sample catalog JSON
- `scripts/` QR generation + catalog seeding
- `firestore.rules` Security rules

---
**Stretch ideas:** translation toggle, presence/typing, staff verification, richer analytics.
# UBHackathon25
