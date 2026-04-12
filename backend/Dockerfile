# Backend Dockerfile - FastAPI (Python 3.11)
FROM python:3.11-slim

# Çalışma dizini
WORKDIR /app

# Bağımlılıkları önce kopyala (cache optimizasyonu)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodunu kopyala
COPY . .

# Port
EXPOSE 8000

# Uvicorn ile başlat
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
