# MelodyAPI — SaaS Music Data API
Express.js + PostgreSQL/Supabase + JWT + API Key + Vercel.

## Local
npm install

Buat `.env` dari `.env.example`, isi DATABASE_URL dan JWT_SECRET. Jalankan `sql/schema.sql` lalu `sql/seed.sql` di Supabase SQL Editor.

npm run dev

## Flow
Register/Login -> JWT -> Create API Key -> panggil /v1/* dengan x-api-key.

## Endpoint
POST /api/auth/register
POST /api/auth/login
POST /api/keys (JWT)
GET /api/keys (JWT)
DELETE /api/keys/:id (JWT)
GET /v1/tracks (API Key)
GET /v1/tracks/:id (API Key)
GET /v1/artists (API Key)
GET /v1/genres (API Key)
GET /v1/stats (API Key)
