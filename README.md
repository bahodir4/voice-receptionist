# Voice Receptionist

An AI-powered voice receptionist that handles inbound/outbound phone calls, browser voice sessions, and text chat — with a full admin analytics panel.

---

## Architecture

![Architecture](docs/imgs/Architecture.png)

---

## Credential Setup

### 1. LiveKit
1. Create a project at [cloud.livekit.io](https://cloud.livekit.io)
2. Copy **URL**, **API Key**, **API Secret** → `backend/.env`

### 2. Groq
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key → `GROK_API_KEY` in `backend/.env`

### 3. ElevenLabs
1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Go to **Profile → API Keys** → copy key → `ELEVENLABS_API_KEY`
3. Optionally choose a voice ID → `ELEVENLABS_VOICE_ID`

### 4. Twilio (Phone calls)
1. Sign up at [console.twilio.com](https://console.twilio.com)
2. Buy a phone number → `TWILIO_PHONE_NUMBER`
3. Copy **Account SID** and **Auth Token** → `backend/.env`
4. Set your number's webhook URLs:
   - **Voice** → `https://your-backend.com/api/phone/webhook/twilio`
   - **Status callback** → `https://your-backend.com/api/phone/webhook/twilio/status`

### 5. LiveKit SIP (one-time, required for phone calls)
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

### 6. Gmail (email verification)
1. Enable 2FA → **myaccount.google.com/apppasswords** → create App Password
2. Set `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` in `backend/.env`

---

## Local Development

### Prerequisites
- Python 3.11+, Node.js 20+, MongoDB 7

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
Edit all three files. At minimum set:

| File | Key variables |
|------|--------------|
| `.env` | `MONGO_ROOT_PASSWORD`, `VITE_API_URL`, `VITE_LIVEKIT_URL` |
| `backend/.env` | `JWT_SECRET`, `LIVEKIT_*`, `GROK_API_KEY`, `ELEVENLABS_API_KEY`, `TWILIO_*`, `MAIL_*` |
| `frontend/.env` | `VITE_API_URL`, `VITE_LIVEKIT_URL` |

### 3. Build and start
```bash
docker compose up --build          # foreground
docker compose up --build -d       # background
docker compose logs -f             # stream logs
docker compose down                # stop
docker compose down -v             # stop + wipe data
```

### Port configuration
Change any port by editing root `.env`:
```env
BACKEND_PORT=9000          # API exposed on host port 9000
FRONTEND_PORT=8080         # Frontend exposed on host port 8080
MONGO_EXPOSED_PORT=27018   # MongoDB exposed on host port 27018
```

### Services
| Service | Host port (default) |
|---------|-------------------|
| Frontend (nginx) | `FRONTEND_PORT` → **3000** |
| Backend API | `BACKEND_PORT` → **8000** |
| MongoDB | `MONGO_EXPOSED_PORT` → **27017** |
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

## Environment Reference

### Root `.env`
| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_ROOT_USER` | `admin` | MongoDB admin username |
| `MONGO_ROOT_PASSWORD` | — | **Required** — MongoDB password |
| `MONGO_EXPOSED_PORT` | `27017` | MongoDB host port |
| `MONGODB_DB_NAME` | `voice_receptionist` | Database name |
| `BACKEND_PORT` | `8000` | API host port |
| `FRONTEND_PORT` | `3000` | Frontend host port |
| `VITE_API_URL` | `http://localhost:8000` | Backend URL (seen by browser) |
| `VITE_LIVEKIT_URL` | — | LiveKit `wss://` URL |

### `backend/.env`
| Variable | Description |
|----------|-------------|
| `HOST` / `PORT` | Bind address and port |
| `MONGODB_URI` | MongoDB URI (overridden in Docker) |
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
