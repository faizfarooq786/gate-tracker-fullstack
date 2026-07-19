# GATE 2028 CS — Topic Tracker (Full-stack)

Add your own topics under each subject and check them off. Everything is stored in **MongoDB**, so your progress is available from any device.

**Stack:** Node.js + Express (API) · MongoDB + Mongoose (database) · vanilla HTML/CSS/JS (frontend, served by Express).

```
gate-tracker-fullstack/
├─ server.js            # Express app + REST API
├─ db.js                # Mongo connection + seed (12 subjects + starter topics)
├─ models/Subject.js    # Mongoose schema (subject + embedded topics)
├─ public/              # frontend (index.html, styles.css, app.js)
├─ .env.example         # copy to .env and add your MONGODB_URI
└─ package.json
```

On first run, if the database is empty, **12 GATE subjects with starter topics** are seeded automatically. After that, the app never overwrites your data.

---

## 1) MongoDB Atlas cluster (free)

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas) and set up an **M0 (free) cluster**.
2. **Database Access** → create a user (remember the username and password).
3. **Network Access** → **Add IP** → **Allow Access from Anywhere** (`0.0.0.0/0`) — fine for testing and deployment.
4. **Database → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://USER:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>`, and add a database name after `/`, e.g. `.../gatetracker?...`

---

## 2) Run locally

```bash
cd gate-tracker-fullstack
cp .env.example .env      # Windows: copy .env.example .env
# open .env and paste your MONGODB_URI
npm install
npm start
```

Open **http://localhost:3000** 🎉

---

## 3) Deploy — Render (recommended)

1. Push this folder to a **GitHub repository**.
2. Go to [render.com](https://render.com) → **New → Web Service** → connect the repo.
3. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Environment → Add Environment Variable:**
   - `MONGODB_URI` = your Atlas connection string
   - (No need to set `PORT` — Render provides it automatically.)
5. **Create Web Service.** ✅ You'll get a live URL.

> Choose **Web Service**, not Static Site — this app runs a Node backend.

---

## 4) Deploy — Vercel (alternative)

Vercel is serverless, so instead of running `server.js` as-is, the API needs to live in `api/` functions. The simplest path is **Render** (above). If you specifically need Vercel, let me know and I'll restructure it.

---

## API reference

| Method | Route | Description |
|---|---|---|
| GET | `/api/state` | All subjects with their topics |
| POST | `/api/subjects` | `{ name, priority }` → create a subject |
| DELETE | `/api/subjects/:id` | Delete a subject (and its topics) |
| POST | `/api/subjects/:id/topics` | `{ name }` → add a topic |
| PATCH | `/api/subjects/:sid/topics/:tid` | `{ done?, name? }` → toggle / rename |
| DELETE | `/api/subjects/:sid/topics/:tid` | Delete a topic |
| GET | `/api/health` | Server + database status |

---

## Notes

- This is a **single-user** app (no authentication). Anyone with the URL can view and edit the data. That's fine for personal use; if you want to make it public, add a login first — let me know.
- Priority: `q` = Quick win, `m` = Moderate, `h` = Heavy.
- The GATE date (~7 Feb 2028) is approximate — update the countdown in `public/app.js` once the official date is announced.
