# undanganku.id — SaaS Undangan Digital Pernikahan Islam

Aplikasi SaaS untuk membuat undangan digital pernikahan Islami.
Pengguna bisa daftar, pilih tema, isi data, dan bagikan link undangan.

## Tech Stack

| Layer       | Teknologi                     |
|-------------|-------------------------------|
| Frontend    | React 18 + TypeScript + Vite  |
| Styling     | Tailwind CSS                  |
| Database    | Supabase (PostgreSQL)         |
| Auth        | Supabase Auth                 |
| Storage     | Supabase Storage (foto)       |
| State       | Zustand                       |
| Routing     | React Router v6               |
| Toast       | react-hot-toast               |
| Deployment  | Vercel                        |

## Struktur Folder

```
src/
├── components/        # Komponen reusable (UI, layout, editor)
├── hooks/
│   ├── useInvitations.ts   # CRUD undangan
│   ├── useGuests.ts        # RSVP & manajemen tamu
│   └── usePhotoUpload.ts   # Upload foto ke Storage
├── lib/
│   └── supabase.ts         # Supabase client
├── pages/
│   ├── auth/AuthPage.tsx        # Login & Register
│   ├── dashboard/
│   │   ├── DashboardPage.tsx    # List undangan
│   │   ├── EditorPage.tsx       # Buat/edit undangan
│   │   └── GuestsPage.tsx       # Manajemen tamu
│   └── invitation/
│       └── InvitationPage.tsx   # Halaman publik undangan
├── store/
│   └── authStore.ts        # Zustand auth state
└── types/
    └── database.ts         # TypeScript types dari Supabase
```

## Setup (langkah demi langkah)

### 1. Clone & install

```bash
git clone https://github.com/kamu/undangan-saas.git
cd undangan-saas
npm install
```

### 2. Buat project Supabase

1. Daftar di https://supabase.com
2. Buat project baru
3. Masuk ke **SQL Editor**, paste isi file `supabase/migrations/001_initial_schema.sql`
4. Klik **Run** — semua tabel dan RLS langsung terbuat

### 3. Konfigurasi .env

```bash
cp .env.example .env
```

Isi nilai dari **Supabase Dashboard → Settings → API**:
- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_ANON_KEY` = anon/public key

### 4. Jalankan lokal

```bash
npm run dev
# Buka http://localhost:5173
```

### 5. Deploy ke Vercel

```bash
npm install -g vercel
vercel
# Ikuti instruksi, set env variables saat ditanya
```

Atau lewat **Vercel Dashboard**:
1. Import repo GitHub
2. Add Environment Variables (dari .env)
3. Deploy otomatis setiap push ke main

## URL Struktur

| URL                        | Halaman                     |
|----------------------------|-----------------------------|
| `/`                        | Redirect ke dashboard       |
| `/auth`                    | Login / Register            |
| `/dashboard`               | Daftar undangan user        |
| `/dashboard/buat`          | Buat undangan baru          |
| `/dashboard/edit/:id`      | Edit undangan               |
| `/dashboard/tamu/:id`      | Manajemen tamu RSVP         |
| `/u/:slug`                 | Halaman undangan (publik)   |

## Roadmap Fitur Selanjutnya

- [ ] Payment Midtrans (free 1 undangan, pro unlimited)
- [ ] 3+ tema visual (floral, modern, klasik)
- [ ] Import tamu dari Excel/CSV
- [ ] Kirim WA blast ke semua tamu
- [ ] Live ucapan & doa di halaman undangan
- [ ] Galeri foto pengantin
- [ ] Custom domain per undangan

## Lisensi

MIT
