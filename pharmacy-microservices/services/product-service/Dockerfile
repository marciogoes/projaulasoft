# Dockerfile — Product Service
# Didático: usamos imagem slim para manter o container pequeno.

FROM python:3.11-slim

WORKDIR /app

# Copia apenas requirements primeiro (melhor uso do cache de layers do Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY ./app ./app

# Cria diretório de dados (onde o SQLite ficará)
RUN mkdir -p /app/data

EXPOSE 8001

# Comando de inicialização — uvicorn sem reload em produção
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
