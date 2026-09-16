# Vlanda Dental Backend

Backend API untuk menghubungkan halaman customer dan admin.

## Setup

Database yang dipakai adalah PostgreSQL. DBeaver bisa dipakai untuk membuat database dan melihat tabel/data.

Contoh database lokal:

- Host: `localhost`
- Port: `5432`
- Database: `vlanda_dental`
- User: `postgres`
- Password: sesuaikan dengan PostgreSQL lokal

```bash
cd backend
npm install
copy .env.example .env
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Default API berjalan di `http://localhost:4000`.

Pastikan `DATABASE_URL` di `.env` sudah sesuai koneksi PostgreSQL yang dibuat di DBeaver/PostgreSQL.

## Modul API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users`
- `GET /api/doctors`
- `GET /api/services`
- `GET /api/schedules`
- `GET /api/reservations`
- `GET /api/articles`

Upload gambar artikel memakai field `image` di endpoint artikel.
