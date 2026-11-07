FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends dos2unix && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN dos2unix entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 8000
# Run via sh: the compose bind mount replaces /app, dropping the image's chmod +x.
CMD ["sh", "./entrypoint.sh"]
