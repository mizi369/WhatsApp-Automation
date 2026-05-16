# MNF Engineering Enterprise AI System

Sistem pengurusan perusahaan profesional untuk MNF Engineering Services yang dilengkapi dengan automasi WhatsApp, pengurusan inventori, penggajian (payroll), dan integrasi AI Gemini.

## 🚀 Ciri-ciri Utama

- **Dashboard Terpusat**: Ringkasan operasi perniagaan dalam satu paparan.
- **Automasi WhatsApp**: Bot respons automatik menggunakan `whatsapp-web.js`.
- **Pengurusan Inventori**: Jejaki stok bahan binaan dan alat ganti.
- **Sistem Penggajian**: Pengiraan gaji pekerja dan penjanaan slip gaji.
- **Integrasi Supabase**: Database masa nyata (real-time) untuk keselamatan data.
- **AI Assistant**: Dikuasakan oleh Google Gemini untuk bantuan teknikal dan pentadbiran.

## 🛠️ Persediaan Pembangunan (Local)

1. **Clone Repository**:
   ```bash
   git clone <url-github-anda>
   cd mnf-engineering-enterprise
   ```

2. **Pasang Dependencies**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**:
   Cipta fail `.env` di root directory dan masukkan kunci berikut:
   ```env
   GEMINI_API_KEY=your_gemini_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   PORT=3000
   ```

4. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```

## 🌐 Deploy ke Railway

Aplikasi ini telah dikonfigurasi untuk berfungsi di **Railway.app** dengan sokongan Chromium (untuk WhatsApp).

### Konfigurasi Railway:
- **Build Command**: `npm run build`
- **Start Command**: `node dist/server.js` (atau mengikut konfigurasi `package.json`)
- **Environment Variables**: Pastikan anda menambah semua kunci di atas dalam dashboard Railway.

## 📁 Struktur Projek

- `/src`: Kod sumber frontend (React + Tailwind).
- `/service.ts`: Backend server (Express) yang mengendalikan WhatsApp dan API.
- `/supabase_schema.sql`: Skrip untuk menyediakan struktur database di Supabase.

## ⚖️ Lesen

Hak Cipta Terpelihara © 2024 MNF Engineering Services.
