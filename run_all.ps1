# run_all.ps1 - One-shot setup + build + run for booking_application
# Run from project root. Requires Docker Desktop running and PowerShell run as Admin.

Set-StrictMode -Version Latest
$root = (Get-Location).Path
Write-Host "Project root: $root"

# --- 1) Ensure docker-compose.yml (overwrite with working compose) ---
$dockerCompose = @'
services:
  db:
    image: postgres:15
    container_name: booking_db
    restart: always
    environment:
      POSTGRES_USER: roshai
      POSTGRES_PASSWORD: roshaipass
      POSTGRES_DB: roshai_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  service_a:
    build: ./django_service
    container_name: reservation_service
    command: >
      sh -c "
      python manage.py migrate &&
      python manage.py seed_data &&
      gunicorn service_a.wsgi:application --bind 0.0.0.0:8000 --workers 3
      "
    environment:
      POSTGRES_USER: roshai
      POSTGRES_PASSWORD: roshaipass
      POSTGRES_DB: roshai_db
      POSTGRES_HOST: db
      POSTGRES_PORT: 5432
      JWT_SECRET: supersecret_shared_jwt_key
      JWT_ALGORITHM: HS256
      SERVICE_A_INTERNAL_TOKEN: service-a-internal-token
    depends_on:
      - db
    ports:
      - "8000:8000"

  service_b:
    build: ./service_b
    container_name: api_gateway
    environment:
      DATABASE_URL: postgresql://roshai:roshaipass@db:5432/roshai_db
      JWT_SECRET: supersecret_shared_jwt_key
      JWT_ALGORITHM: HS256
      SERVICE_A_URL: http://service_a:8000
      SERVICE_A_INTERNAL_TOKEN: service-a-internal-token
      PORT: 4000
    depends_on:
      - db
      - service_a
    ports:
      - "4000:4000"

  frontend:
    build: ./frontend
    container_name: booking_frontend
    environment:
      REACT_APP_API_URL: http://localhost:4000/api
    ports:
      - "3000:80"
    depends_on:
      - service_b

volumes:
  pgdata:
'@

$composePath = Join-Path $root "docker-compose.yml"
$dockerCompose | Set-Content -Path $composePath -Encoding UTF8 -Force
Write-Host "Wrote docker-compose.yml"

# --- 2) Ensure django_service/Dockerfile and minimal requirements and settings ---
$djangoDir = Join-Path $root "django_service"
if (-not (Test-Path $djangoDir)) { New-Item -ItemType Directory -Path $djangoDir | Out-Null }

$djangoDf = @'
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY . /app
EXPOSE 8000
CMD ["gunicorn", "service_a.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
'@
Set-Content -Path (Join-Path $djangoDir "Dockerfile") -Value $djangoDf -Encoding UTF8 -Force
Write-Host "Wrote django_service/Dockerfile"

# minimal requirements if missing
$reqPath = Join-Path $djangoDir "requirements.txt"
if (-not (Test-Path $reqPath)) {
  @"
Django>=4.2
djangorestframework
psycopg2-binary
pyjwt
gunicorn
python-dotenv
bcrypt
"@ | Set-Content -Path $reqPath -Encoding UTF8
  Write-Host "Created django_service/requirements.txt"
} else {
  Write-Host "django_service/requirements.txt exists"
}

# Ensure service_a/settings.py (correct TEMPLATES and env usage)
$settingsPath = Join-Path $djangoDir "service_a\settings.py"
$settingsDir = Split-Path $settingsPath -Parent
if (-not (Test-Path $settingsDir)) { New-Item -ItemType Directory -Path $settingsDir | Out-Null }

$settingsPy = @'
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret")
DEBUG = os.getenv("DEBUG", "1") == "1"
ALLOWED_HOSTS = ["*"]
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "reservations",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "service_a.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
WSGI_APPLICATION = "service_a.wsgi.application"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "roshai_db"),
        "USER": os.getenv("POSTGRES_USER", "roshai"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "roshaipass"),
        "HOST": os.getenv("POSTGRES_HOST", "db"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}
AUTH_USER_MODEL = "reservations.User"
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "reservations.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}
STATIC_URL = "/static/"
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
SERVICE_A_INTERNAL_TOKEN = os.getenv("SERVICE_A_INTERNAL_TOKEN")
'@
Set-Content -Path $settingsPath -Value $settingsPy -Encoding UTF8 -Force
Write-Host "Wrote service_a/settings.py"

# --- 3) Ensure minimal frontend Dockerfile and simple React scaffold if missing ---
$frontendDir = Join-Path $root "frontend"
if (-not (Test-Path $frontendDir)) { New-Item -ItemType Directory -Path $frontendDir | Out-Null }

$frontendDf = @'
# build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# production stage
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
'@
Set-Content -Path (Join-Path $frontendDir "Dockerfile") -Value $frontendDf -Encoding UTF8 -Force
Write-Host "Wrote frontend/Dockerfile"

# minimal frontend package.json if missing
$frontendPkg = Join-Path $frontendDir "package.json"
if (-not (Test-Path $frontendPkg)) {
  @'
{
  "name": "booking-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
'@ | Set-Content -Path $frontendPkg -Encoding UTF8 -Force
  Write-Host "Created frontend/package.json"
} else {
  Write-Host "frontend/package.json exists"
}

# ensure public/index.html and src/index.js, index.css
$publicDir = Join-Path $frontendDir "public"
$srcDir = Join-Path $frontendDir "src"
if (-not (Test-Path $publicDir)) { New-Item -ItemType Directory -Path $publicDir | Out-Null }
if (-not (Test-Path $srcDir)) { New-Item -ItemType Directory -Path $srcDir | Out-Null }

$indexHtml = @'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Booking Frontend</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
'@
Set-Content -Path (Join-Path $publicDir "index.html") -Value $indexHtml -Encoding UTF8 -Force

$indexJs = @'
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
function App(){ return <div style={{padding:20,fontFamily:"Arial"}}><h1>Booking Frontend (Demo)</h1><p>Frontend ready.</p></div> }
const root = createRoot(document.getElementById("root"));
root.render(<App />);
'@
Set-Content -Path (Join-Path $srcDir "index.js") -Value $indexJs -Encoding UTF8 -Force

$indexCss = "body{margin:0;font-family:Arial,Helvetica,sans-serif}"
Set-Content -Path (Join-Path $srcDir "index.css") -Value $indexCss -Encoding UTF8 -Force

Write-Host "Ensured minimal frontend scaffold"

# --- 4) Ensure service_b Dockerfile and minimal package.json if missing ---
$serviceBDir = Join-Path $root "service_b"
if (-not (Test-Path $serviceBDir)) { New-Item -ItemType Directory -Path $serviceBDir | Out-Null }

$serviceBDf = @'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 4000
CMD ["node", "src/index.js"]
'@
Set-Content -Path (Join-Path $serviceBDir "Dockerfile") -Value $serviceBDf -Encoding UTF8 -Force
Write-Host "Wrote service_b/Dockerfile"

$serviceBPkg = Join-Path $serviceBDir "package.json"
if (-not (Test-Path $serviceBPkg)) {
  @'
{
  "name": "service_b",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "axios": "^1.6.5",
    "bcrypt": "^5.1.1",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.1"
  }
}
'@ | Set-Content -Path $serviceBPkg -Encoding UTF8 -Force
  Write-Host "Created service_b/package.json"
} else {
  Write-Host "service_b/package.json exists"
}

# --- 5) For safety: ensure minimal Django app files exist (only if missing) ---
# (Don't overwrite existing app code if present - only create when missing)
$reservationsDir = Join-Path $djangoDir "reservations"
if (-not (Test-Path $reservationsDir)) {
  New-Item -ItemType Directory -Path $reservationsDir | Out-Null
  # minimal models.py to avoid import errors
  @'
from django.db import models
from django.contrib.auth.models import AbstractUser
class User(AbstractUser): pass
'@ | Set-Content -Path (Join-Path $reservationsDir "models.py") -Encoding UTF8 -Force
  @'
from django.urls import path
urlpatterns = []
'@ | Set-Content -Path (Join-Path $reservationsDir "urls.py") -Encoding UTF8 -Force
  Write-Host "Created very small reservations app placeholder (only because none existed)"
} else {
  Write-Host "reservations app exists - not overwriting"
}

# --- 6) Clean previous state and build & run ---
Write-Host "Stopping and removing existing containers (if any)..."
docker compose down --volumes --remove-orphans | Out-Null

Write-Host "Pruning unused images (this will free space)..."
docker system prune -af | Out-Null

Write-Host "Building all services (this will take a few minutes)..."
docker compose build --no-cache

Write-Host "Starting containers..."
docker compose up -d

# --- 7) Show status ---
Write-Host "`nContainers status:"
docker compose ps

Write-Host "`nTailing logs (ctrl+C to stop)..."
docker compose logs -f --tail 200
