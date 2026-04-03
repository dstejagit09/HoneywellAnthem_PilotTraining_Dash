# Deployment Plan — HPT_Sol Web Application

## Architecture Summary

| Component | Technology | Deployment Target |
|-----------|-----------|-------------------|
| Frontend SPA | Vite + React + TypeScript | **Vercel** (free tier) |
| Python Agent | LiveKit Agents SDK + worker | **AWS EC2** (t3.small, Docker) |
| Backend | Supabase (DB, Edge Functions) | **Already deployed** |
| External APIs | OpenAI, Deepgram, ElevenLabs, Google Maps | API keys in env vars |

---

## Step 1: Frontend — Vercel

### Setup

1. Connect GitHub repo to Vercel
2. Set **Root Directory** to `app/`
3. Vercel auto-detects Vite — no build config needed
4. Create `app/vercel.json` for SPA client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Environment Variables (Vercel Dashboard)

| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_LIVEKIT_URL` | LiveKit Cloud WebSocket URL |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console |

---

## Step 2: Python Agent — AWS EC2

### Dockerfile

Already created at repo root (`Dockerfile`):

```dockerfile
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends libsndfile1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY agent/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY agent/ ./agent/
CMD ["python", "-m", "agent.worker", "start"]
```

Key details:
- `libsndfile1` is required by the `soundfile` Python package (voice pipeline dependency)
- `agent/__init__.py` exists, so `python -m agent.worker` works as a module invocation
- `.dockerignore` excludes `app/`, `.git/`, docs, logs from the build context

### EC2 Instance Setup

1. **Launch EC2 instance** (AWS Console → EC2 → Launch Instance)
   - AMI: **Amazon Linux 2023**
   - Instance type: **t3.small** (2 GB RAM, 2 vCPU burstable)
   - Key pair: create or select existing
   - Security group: **SSH only (port 22)** from your IP — no other inbound ports needed (agent connects outward to LiveKit)
   - Storage: **20 GB gp3** (default 8 GB is tight after Docker images)

2. **SSH into instance**
   ```bash
   ssh -i your-key.pem ec2-user@<public-ip>
   ```

3. **Create `~/.env`** on the instance with agent secrets:
   ```
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=...
   LIVEKIT_API_SECRET=...
   OPENAI_API_KEY=...
   DEEPGRAM_API_KEY=...
   ELEVEN_API_KEY=...
   ```

4. **Run the setup script** (or run commands from `deploy/ec2-setup.sh` manually):
   ```bash
   # Option A: Run script directly from repo after cloning
   git clone https://github.com/pranjalashutosh/HoneywellAnthem_PilotTraining_Sol.git ~/hpt-agent
   bash ~/hpt-agent/deploy/ec2-setup.sh

   # Option B: Manual steps
   sudo dnf update -y && sudo dnf install -y docker git
   sudo systemctl enable --now docker
   sudo usermod -aG docker ec2-user
   cd ~/hpt-agent && docker build -t hpt-agent .
   docker run -d --name hpt-agent --restart unless-stopped --env-file ~/.env hpt-agent
   ```

5. **Verify** — check logs:
   ```bash
   docker logs -f hpt-agent
   ```
   Should see the agent register with LiveKit and wait for room connections.

### EC2 Cost Note

t3.small costs ~$15/mo on-demand. The user's $100 AWS credits cover ~6 months of operation. The agent must stay running to handle incoming LiveKit room connections.

### Updating the Agent

```bash
cd ~/hpt-agent && git pull
docker build -t hpt-agent .
docker stop hpt-agent && docker rm hpt-agent
docker run -d --name hpt-agent --restart unless-stopped --env-file ~/.env hpt-agent
```

---

## Step 3: Supabase Edge Functions — Verify Secrets

Ensure these secrets are configured in **Supabase Dashboard → Settings → Edge Functions → Secrets**:

| Secret | Used By |
|--------|---------|
| `OPENAI_API_KEY` | `generate-atc` Edge Function |
| `LIVEKIT_API_KEY` | `livekit-token` Edge Function |
| `LIVEKIT_API_SECRET` | `livekit-token` Edge Function |

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/vercel.json` | SPA rewrite rules for client-side routing |
| `Dockerfile` | Python agent container definition |
| `.dockerignore` | Exclude non-agent files from Docker build context |
| `deploy/ec2-setup.sh` | EC2 instance setup script (Docker + agent) |

---

## Cost Estimate

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Free (Hobby) | $0/mo |
| AWS EC2 | t3.small (on-demand) | ~$15/mo |
| Supabase | Free | $0/mo |
| External APIs | Pay-per-use | Variable |

**Total infrastructure: ~$15/month** (covered by $100 AWS credits for ~6 months)

---

## End-to-End Verification

1. `cd app && pnpm build` — confirm frontend builds with zero errors
2. `docker build -t hpt-agent .` — confirm agent Docker image builds locally
3. Deploy frontend to Vercel → open URL, confirm PFD renders and cockpit controls work
4. Deploy agent to EC2 → check Docker logs for successful agent startup
5. Start a drill → verify LiveKit room connects (browser ↔ agent)
6. Verify ATC voice generation (Supabase Edge Function → OpenAI → agent TTS)
7. Verify STT pipeline (pilot speech → Deepgram → readback scoring)
