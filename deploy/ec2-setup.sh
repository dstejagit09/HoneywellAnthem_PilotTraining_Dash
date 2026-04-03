#!/bin/bash
set -euo pipefail

# ─── EC2 Instance Setup for HPT Agent ─────────────────────
# Run on a fresh Amazon Linux 2023 t3.small instance.
# Prerequisites: SSH access, .env file uploaded to ~/

echo "=== Installing Docker and Git ==="
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Apply group change without logout/login
echo "=== Cloning repo and building Docker image ==="
sudo -u ec2-user bash -c '
  cd ~
  git clone https://github.com/pranjalashutosh/HoneywellAnthem_PilotTraining_Sol.git hpt-agent
  cd hpt-agent
  docker build -t hpt-agent .
'

echo "=== Starting agent container ==="
# Expects ~/.env with: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET,
#   OPENAI_API_KEY, DEEPGRAM_API_KEY, ELEVEN_API_KEY
sudo -u ec2-user bash -c '
  docker run -d \
    --name hpt-agent \
    --restart unless-stopped \
    --env-file ~/.env \
    hpt-agent
'

echo "=== Done! Check logs with: docker logs -f hpt-agent ==="
