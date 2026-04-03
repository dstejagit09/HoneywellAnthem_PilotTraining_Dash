FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends libsndfile1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY agent/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY agent/ ./agent/
CMD ["python", "-m", "agent.worker", "start"]
