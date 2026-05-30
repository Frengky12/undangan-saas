-- ============================================
-- UNDANGAN SAAS - Schema Database Supabase
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. TABEL INVITATIONS
create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  slug        text unique not null,           -- URL unik: /u/rafi-sarah
  theme_id    text not null default 'floral', -- floral | modern | klasik
  is_active   boolean not null default true,
  expires_at  timestamptz,                    -- null = tidak ada batas waktu
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Data undangan tersimpan sebagai JSON
  data jsonb not null default '{}'::jsonb
  -- Contoh isi data:
  -- {
  --   "groomName": "Muhammad Rafi",
  --   "brideName": "Sarah Amalia",
  --   "akadDate": "2025-08-10",
  --   "akadTime": "08:00",
  --   "resepsiDate": "2025-08-10",
  --   "resepsiTime": "11:00",
  --   "venue": "Gedung Serbaguna Al-Ikhlas",
  --   "address": "Jl. Sudirman No.12, Palembang",
  --   "mapsUrl": "https://maps.google.com/...",
  --   "photoUrl": "https://...supabase.co/storage/...",
  --   "musicUrl": null,
  --   "quranVerse": "QS. Ar-Rum: 21",
  --   "openingText": "Dengan memohon ridho Allah SWT..."
  -- }
);

-- 2. TABEL GUESTS (RSVP)
create table public.guests (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid references public.invitations(id) on delete cascade not null,
  name          text not null,
  phone         text,
  attendance    text check (attendance in ('hadir', 'tidak_hadir', 'belum_konfirmasi'))
                not null default 'belum_konfirmasi',
  message       text,                          -- ucapan & doa
  created_at    timestamptz not null default now()
);

-- 3. TABEL ORDERS (PEMBAYARAN)
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  invitation_id   uuid references public.invitations(id) on delete set null,
  amount          integer not null,            -- dalam Rupiah
  status          text check (status in ('pending', 'paid', 'expired', 'cancelled'))
                  not null default 'pending',
  midtrans_id     text unique,                 -- order_id dari Midtrans
  snap_token      text,                        -- token untuk Midtrans Snap
  expires_at      timestamptz,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- 4. TABEL PROFILES (data tambahan user)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  plan       text check (plan in ('free', 'pro')) not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - WAJIB DIAKTIFKAN
-- ============================================

alter table public.invitations enable row level security;
alter table public.guests      enable row level security;
alter table public.orders      enable row level security;
alter table public.profiles    enable row level security;

-- Invitations: user hanya bisa akses miliknya sendiri
create policy "User manages own invitations"
  on public.invitations for all
  using (auth.uid() = user_id);

-- Undangan bisa dilihat publik (untuk halaman undangan yang dibagikan)
create policy "Public can view active invitations"
  on public.invitations for select
  using (is_active = true);

-- Guests: siapapun bisa tambah RSVP (bukan hanya pemilik)
create policy "Anyone can add guest RSVP"
  on public.guests for insert
  with check (true);

-- Guests: hanya pemilik undangan yang bisa lihat semua tamu
create policy "Owner can view guests"
  on public.guests for select
  using (
    invitation_id in (
      select id from public.invitations where user_id = auth.uid()
    )
  );

-- Orders: user hanya akses ordernya sendiri
create policy "User manages own orders"
  on public.orders for all
  using (auth.uid() = user_id);

-- Profiles: user akses profilenya sendiri
create policy "User manages own profile"
  on public.profiles for all
  using (auth.uid() = id);

-- ============================================
-- TRIGGER: Auto-buat profile saat register
-- ============================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- STORAGE BUCKET untuk foto undangan
-- ============================================
insert into storage.buckets (id, name, public)
values ('invitation-photos', 'invitation-photos', true);

create policy "Anyone can view photos"
  on storage.objects for select
  using (bucket_id = 'invitation-photos');

create policy "Users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'invitation-photos' and auth.role() = 'authenticated');

create policy "Users can delete own photos"
  on storage.objects for delete
  using (bucket_id = 'invitation-photos' and auth.uid()::text = (storage.foldername(name))[1]);
