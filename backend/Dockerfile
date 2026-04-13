# Backend Dockerfile - FastAPI (Python 3.11) - SECURED
FROM python:3.11-slim

# Güvenlik: root olmayan kullanıcı oluştur
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

# Çalışma dizini
WORKDIR /app

# Bağımlılıkları önce kopyala (cache optimizasyonu)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodunu kopyala
COPY . .

# Dosya sahipliğini değiştir
RUN chown -R appuser:appuser /app

# Root olmayan kullanıcıya geç
USER appuser

# Port
EXPOSE 8000

# Uvicorn ile başlat
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
