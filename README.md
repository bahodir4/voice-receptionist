# Voice Receptionist

An AI-powered voice receptionist that handles inbound/outbound phone calls, browser voice sessions, and text chat — with a full admin analytics panel.

> **MongoDB** is hosted externally (MongoDB Atlas or any other provider). There is no local Mongo container — just plug in your connection string.

---

## Screenshots

| Login | Dashboard |
|-------|-----------|
| ![Login](docs/imgs/login.png) | ![Dashboard](docs/imgs/dashboard.png) |

| Voice Chat | Text Chat |
|------------|-----------|
| ![Voice Chat](docs/imgs/voice-chat.png) | ![Text Chat](docs/imgs/text-chat.png) |

| Analytics Overview | Business Settings |
|--------------------|-------------------|
| ![Admin Overview](docs/imgs/admin-overview.png) | ![Admin Settings](docs/imgs/admin-settings.png) |

---

## Architecture

![Architecture](docs/imgs/Architecture.png)

---

## Credential Setup

### 1. MongoDB Atlas
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write access
3. Whitelist your IP (or `0.0.0.0/0` for development)
4. **Connect → Drivers** → copy the connection string
5. Paste into `backend/.env` as `MONGODB_URI`:
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/voice_receptionist?retryWrites=true&w=majority
   ```

### 2. LiveKit
1. Create a project at [cloud.livekit.io](https://cloud.livekit.io)
2. Copy **URL**, **API Key**, **API Secret** → `backend/.env`

### 3. Groq
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key → `GROK_API_KEY` in `backend/.env`

### 4. ElevenLabs
1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Go to **Profile → API Keys** → copy key → `ELEVENLABS_API_KEY`
3. Optionally choose a voice ID → `ELEVENLABS_VOICE_ID`

### 5. Twilio (Phone calls)
1. Sign up at [console.twilio.com](https://console.twilio.com)
2. Buy a phone number → `TWILIO_PHONE_NUMBER`
3. Copy **Account SID** and **Auth Token** → `backend/.env`
4. Set your number's webhook URLs:
   - **Voice** → `https://your-backend.com/api/phone/webhook/twilio`
   - **Status callback** → `https://your-backend.com/api/phone/webhook/twilio/status`

### 6. LiveKit SIP (one-time, required for phone calls)
```bash
# Install LiveKit CLI: https://docs.livekit.io/home/cli/cli-setup/

# Inbound trunk (Twilio → LiveKit)
lk sip inbound create \
  --name "twilio-inbound" \
  --username YOUR_SIP_USERNAME \
  --password YOUR_SIP_PASSWORD

# Dispatch rule (routes calls to agent)
lk sip dispatch create \
  --trunk-id <INBOUND_TRUNK_ID> \
  --rule individual \
  --agent-name voice-receptionist

# Outbound trunk (LiveKit → Twilio)
lk sip outbound create \
  --name "twilio-outbound" \
  --address sip.twilio.com \
  --username YOUR_TWILIO_SIP_USERNAME \
  --password YOUR_TWILIO_SIP_PASSWORD

# Then set in backend/.env:
# LIVEKIT_SIP_DOMAIN              ← LiveKit console → SIP Settings
# LIVEKIT_SIP_INBOUND_TRUNK_ID    ← from inbound create above
# LIVEKIT_SIP_OUTBOUND_TRUNK_ID   ← from outbound create above
# TWILIO_SIP_USERNAME / PASSWORD  ← same credentials used above
```

### 7. Gmail (email verification)
1. Enable 2FA → **myaccount.google.com/apppasswords** → create App Password
2. Set `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` in `backend/.env`

---

## Local Development

### Prerequisites
- Python 3.11+, Node.js 20+
- A MongoDB Atlas cluster (free tier works fine)

### Backend
```bash
cd backend
cp .env.example .env            # fill in your values

python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Terminal 1 — API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Agent worker
python agent.py dev
```

### Frontend
```bash
cd frontend
cp .env.example .env            # fill in your values
npm install
npm run dev                     # → http://localhost:5173
```

---

## Docker

### 1. Copy env files
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Fill values
Edit both files. At minimum set:

| File | Key variables |
|------|--------------|
| `.env` | `VITE_API_URL`, `VITE_LIVEKIT_URL` |
| `backend/.env` | `MONGODB_URI`, `JWT_SECRET`, `LIVEKIT_*`, `GROK_API_KEY`, `ELEVENLABS_API_KEY`, `TWILIO_*`, `MAIL_*` |
| `frontend/.env` | `VITE_API_URL`, `VITE_LIVEKIT_URL` |

### 3. Build and start
```bash
docker compose up --build          # foreground
docker compose up --build -d       # background
docker compose logs -f             # stream logs
docker compose down                # stop
```

### Port configuration
```env
BACKEND_PORT=9000          # API exposed on host port 9000
FRONTEND_PORT=8080         # Frontend exposed on host port 8080
```

### Services
| Service | Host port (default) |
|---------|-------------------|
| Frontend (nginx) | `FRONTEND_PORT` → **3000** |
| Backend API | `BACKEND_PORT` → **8000** |
| Agent Worker | no port (connects outbound to LiveKit) |

---

## Features

| Page | Route | Description |
|------|-------|-------------|
| Voice Chat | `/voice` | Browser mic → LiveKit agent → ElevenLabs TTS |
| Text Chat | `/chat` | SSE streaming conversation with Groq LLM |
| Phone Calls | `/phone` | Twilio SIP inbound + outbound dial pad |
| Analytics | `/admin` | Stats, call logs, chat history, 7-day chart |
| Settings | `/admin → Settings` | Business info, FAQs, custom AI instructions |

---

## Auto End-of-Call Detection

The agent automatically detects when a conversation is over and hangs up without any manual intervention:

- When the caller says **"goodbye"**, **"thank you, goodbye"**, **"have a nice day"**, or any clear farewell phrase, the agent calls the internal `end_conversation` tool
- The agent delivers a brief farewell reply, then disconnects the room **3.5 seconds** later (giving TTS time to finish)
- This works for both browser voice sessions and phone calls (SIP)

No extra configuration needed — it is built into the agent's system prompt and function toolset.

---

## Environment Reference

### Root `.env`
| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | `8000` | API host port |
| `FRONTEND_PORT` | `3000` | Frontend host port |
| `VITE_API_URL` | `http://localhost:8000` | Backend URL (seen by browser) |
| `VITE_LIVEKIT_URL` | — | LiveKit `wss://` URL |

### `backend/.env`
| Variable | Description |
|----------|-------------|
| `HOST` / `PORT` | Bind address and port |
| `MONGODB_URI` | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `MONGODB_DB_NAME` | Database name (default: `voice_receptionist`) |
| `JWT_SECRET` | Random 32+ char secret for tokens |
| `LIVEKIT_URL/API_KEY/API_SECRET` | LiveKit project credentials |
| `GROK_API_KEY/MODEL` | Groq LLM credentials |
| `ELEVENLABS_API_KEY/VOICE_ID/MODEL_ID` | ElevenLabs credentials |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` | Twilio credentials |
| `LIVEKIT_SIP_DOMAIN/INBOUND_TRUNK_ID/OUTBOUND_TRUNK_ID` | SIP trunk IDs |
| `TWILIO_SIP_USERNAME/PASSWORD` | SIP inbound auth |
| `MAIL_USERNAME/PASSWORD/FROM/SERVER/PORT` | SMTP config |
| `FRONTEND_URL` | Frontend origin for CORS |
| `DEBUG` | Enable debug mode / docs UI |

### `frontend/.env`
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL (must be reachable from browser) |
| `VITE_LIVEKIT_URL` | LiveKit WSS URL |
