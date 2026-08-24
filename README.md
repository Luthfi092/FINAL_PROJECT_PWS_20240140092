Markdown
# 🎵 MelodyAPI SaaS — Music Data & Analytics Platform

MelodyAPI adalah platform SaaS B2B Music Data & Analytics Platform yang dirancang untuk membantu pengembang (*developers*) dan pelaku industri musik mengelola serta mengonsumsi data lagu, artis, genre, dan album secara aman dan terstruktur. Menggunakan arsitektur Express.js serverless-ready yang terhubung ke PostgreSQL Supabase, MelodyAPI mengimplementasikan otentikasi ganda (JWT untuk Dashboard Internal dan X-API-KEY untuk Developer Portal), kontrol kuota akses, serta pencatatan *usage logging* berkecepatan tinggi.

---

## 📌 Daftar Isi

* Arsitektur Sistem
* Fitur Utama
* Teknologi yang Digunakan (Tech Stack)
* Struktur Direktori Proyek
* Panduan Instalasi & Menjalankan Sistem
* Konfigurasi Environment Variables (.env)
* Skema Database Supabase PostgreSQL
* Dokumentasi Lengkap REST API v1.0
* Panduan Deployment (Vercel & Supabase)

---

## 🏗️ Arsitektur Sistem

```text
[ Developer / Client Application ]
               │
     (X-API-KEY / JWT)
               │
               ▼
   [ Vercel Serverless Function ]
               │
       (Express.js Engine)
      ├── CORS & Express JSON Middleware
      ├── JWT & API Key Authorization Guard
      └── Usage Logging Middleware
               │
               ▼
  [ Supabase Cloud PostgreSQL ]
  (Tracks, Artists, Albums, Genres, Keys, Logs)
✨ Fitur Utama
🔑 Dual-Layer Authentication: Pengamanan akses bertingkat menggunakan JSON Web Token (JWT) untuk manajemen akun dashboard dan kunci x-api-key unik berawalan mk_live_ untuk integrasi third-party.

🎧 Music Data Intelligence Matrix: Menyediakan katalog musik komprehensif yang mencakup parameter audio granular (BPM, Energy, Danceability, Acousticness, Popularity, Explicit Tag, dan Language).

🔍 Dynamic Filtering & Search: Pencarian judul lagu, genre, dan nama artis secara fleksibel menggunakan kueri SQL ILIKE dengan batas pagination dinamis.

⚡ API Usage & Metrics Logging: Pencatatan durasi respon server (response time ms), status HTTP, dan riwayat endpoint secara real-time ke tabel api_usage.

📊 Analytics & Statistics Endpoint: Menyediakan agregasi statistik platform secara instan (total lagu, album, artist, dan genre) untuk kebutuhan analisis dashboard developer.

🛡️ Key Management System: Merchant/Developer dapat membuat API Key baru, melihat riwayat pemakaian, hingga mencabut (revoke) kunci secara real-time.

💻 Teknologi yang Digunakan (Tech Stack)
Backend Engine
Runtime: Node.js v20+ (CommonJS)

Framework: Express.js v4.21+

Security & Auth: jsonwebtoken (JWT), bcryptjs (Password Hashing), cors

Database Driver: pg (PostgreSQL Connection Pooler Node Driver)

Environment: dotenv

Database & Deployment
Database Cloud: Supabase PostgreSQL (Managed DB)

Hosting Platform: Vercel (Serverless Functions Node.js Engine)

Version Control: Git & GitHub (FINAL_PROJECT_PWS_20240140092)

📁 Struktur Direktori Proyek
Plaintext
FINAL_PROJECT_PWS_20240140092/
├── api/
│   ├── apiKey.js            # Generator & Hashing SHA-256 API Key
│   ├── auth.js              # Middleware verifikasi & pendaftaran JWT
│   ├── db.js                # Inisialisasi PostgreSQL Pool Connection
│   └── index.js             # Core Express App & Definisi Endpoint REST API
├── public/
│   └── index.html           # Landing Page / Documentation Interface
├── .env                     # File konfigurasi environment variabel lokal
├── package.json             # Manajer dependensi & script runner
├── schema.sql               # Skema DDL PostgreSQL Supabase
└── vercel.json              # Konfigurasi routing serverless Vercel
🚀 Panduan Instalasi & Menjalankan Sistem
Prasyarat
Node.js: Versi 20.x atau yang lebih baru

npm: Versi 10.x atau yang lebih baru

1. Clone & Masuk ke Direktori Proyek
Bash
git clone [https://github.com/Luthfi092/FINAL_PROJECT_PWS_20240140092.git](https://github.com/Luthfi092/FINAL_PROJECT_PWS_20240140092.git)
cd FINAL_PROJECT_PWS_20240140092
2. Install Dependensi
Bash
npm install
3. Jalankan Mode Development
Bash
npm run dev
Server akan berjalan di http://localhost:3000. Cek health check di http://localhost:3000/api/health.

⚙️ Konfigurasi Environment Variables (.env)
Buat file .env di direktori utama (root) proyek:

Cuplikan kode
# Port lokal aplikasi
PORT=3000

# Rahasia tanda tangan JSON Web Token
JWT_SECRET=melodyapi_super_secret_jwt_key_2026

# String Koneksi Database Supabase PostgreSQL
DATABASE_URL=postgresql://postgres.dmujezcbbrreekqpbvve:5k3batangAPI@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require
🗄️ Skema Database Supabase PostgreSQL
Jalankan perintah SQL berikut pada SQL Editor Dashboard Supabase:

SQL
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(15) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS api_usage (
    id SERIAL PRIMARY KEY,
    api_key_id INT REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    response_ms NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS artists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    debut_year INT,
    bio TEXT
);

CREATE TABLE IF NOT EXISTS albums (
    id SERIAL PRIMARY KEY,
    artist_id INT REFERENCES artists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    release_year INT,
    album_type VARCHAR(50),
    total_tracks INT
);

CREATE TABLE IF NOT EXISTS genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS tracks (
    id SERIAL PRIMARY KEY,
    album_id INT REFERENCES albums(id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration_seconds INT NOT NULL,
    track_number INT DEFAULT 1,
    release_date DATE,
    popularity INT DEFAULT 0,
    explicit BOOLEAN DEFAULT FALSE,
    language VARCHAR(50) DEFAULT 'English',
    bpm INT,
    energy NUMERIC(3,2),
    danceability NUMERIC(3,2),
    acousticness NUMERIC(3,2)
);
🔌 Dokumentasi Lengkap REST API v1.0
Base URL Production: https://final-project-pws-20240140092.vercel.app
Base URL Local: http://localhost:3000

1. System & Authentication (/api)
GET /api/health — Health Check System
Response (200 OK):

JSON
{
  "success": true,
  "service": "MelodyAPI",
  "database": "connected"
}
POST /api/auth/register — Pendaftaran Pengguna Baru
Request Body:

JSON
{
  "name": "Developer Music",
  "email": "dev@musicapp.com",
  "password": "password123"
}
Response (201 Created):

JSON
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Developer Music",
    "email": "dev@musicapp.com",
    "created_at": "2026-08-24T14:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
POST /api/auth/login — Autentikasi User
Request Body:

JSON
{
  "email": "dev@musicapp.com",
  "password": "password123"
}
Response (200 OK):

JSON
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Developer Music",
    "email": "dev@musicapp.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
2. Developer Tokens (/api/keys)
Wajib menyertakan Header: Authorization: Bearer <JWT_TOKEN>

POST /api/keys — Generate API Key Baru
Request Body:

JSON
{
  "name": "Mobile Player Integration"
}
Response (201 Created):

JSON
{
  "success": true,
  "message": "Full API key hanya tampil sekali",
  "api_key": "mk_live_a1b2c3d4e5f6g7h8i9j0",
  "key": {
    "id": 1,
    "name": "Mobile Player Integration",
    "key_prefix": "mk_live_a1b2c3d",
    "created_at": "2026-08-24T14:10:00.000Z"
  }
}
GET /api/keys — List API Key Pengguna
Response (200 OK): Mengembalikan seluruh koleksi API Key aktif beserta status revokasi.

DELETE /api/keys/:id — Revoke API Key
Response (200 OK):

JSON
{
  "success": true,
  "message": "API key dicabut"
}
3. Public Music API (/v1)
Wajib menyertakan Header: x-api-key: mk_live_...

GET /v1/tracks — Fetch Katalog Lagu (Search, Filter, Pagination)
Query Parameters: search (opsional), genre (opsional), artist (opsional), page (default 1), limit (default 10, max 50)

Example URL: /v1/tracks?search=neon&genre=rock&page=1&limit=5

Response (200 OK):

JSON
{
  "success": true,
  "meta": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "total_pages": 1
  },
  "data": [
    {
      "id": 10,
      "title": "Neon Lights",
      "duration_seconds": 210,
      "track_number": 2,
      "release_date": "2025-05-12",
      "popularity": 88,
      "explicit": false,
      "language": "English",
      "bpm": 128,
      "energy": "0.85",
      "danceability": "0.78",
      "acousticness": "0.12",
      "album": "Future Sounds",
      "artist": "Synth Wave",
      "country": "USA",
      "genre": "Rock"
    }
  ]
}
GET /v1/tracks/:id — Detail Track Spesifik
Response (200 OK): Mengembalikan data detail lengkap lagu berdasarkan ID.

GET /v1/genres — Daftar Genre Musik
Response (200 OK): Mengembalikan daftar seluruh genre beserta agregasi jumlah lagu (track_count).

GET /v1/artists — Daftar Artis Musik
Response (200 OK): Mengembalikan katalog artis, asal negara, tahun debut, serta jumlah lagu.

GET /v1/stats — Platform Statistics
Response (200 OK):

JSON
{
  "success": true,
  "data": {
    "tracks": 150,
    "artists": 24,
    "albums": 30,
    "genres": 8
  }
}
☁️ Panduan Deployment (Vercel & Supabase)
1. Deployment Database (Supabase)
Buka dashboard Supabase.

Dapatkan string koneksi Transaction Pooler (Port 6543) dari menu Settings -> Database.

Jalankan skema DDL yang terdapat pada file schema.sql.

2. Deployment App Engine (Vercel)
Push proyek ke repository GitHub (FINAL_PROJECT_PWS_20240140092).

Masuk ke Vercel Dashboard dan pilih Add New Project.

Impor repositori proyek.

Tambahkan Environment Variables pada menu settings:

DATABASE_URL: postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require

JWT_SECRET: melodyapi_super_secret_jwt_key_2026

Klik Deploy.

