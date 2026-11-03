# FOSIS WEB OPS — React/Vite Frontend v2

Frontend ini merupakan revisi dari starter FOSIS sebelumnya. Login dan Dashboard disusun ulang mengikuti **komposisi/layout** referensi yang diberikan, tetapi tetap mempertahankan identitas FOSIS dari project awal: warna, font Inter, menu, modul, data mock, dan alur navigasi.

## Perubahan utama

- Login desktop split-screen: hero/informasi operasional di kiri, form login di kanan.
- Dashboard memakai hierarki seperti referensi: top header, welcome hero, notice card, banner urgent, modul cepat, KPI, SLA, dan review Dept. Head.
- Sidebar desktop sekarang bisa **collapse / expand** melalui tombol di header.
- Status collapse disimpan di `localStorage` dengan key `fosis-sidebar-collapsed`.
- Tablet/mobile tetap responsive; mobile tetap menggunakan drawer + bottom navigation.
- Belum terhubung Laravel/MySQL. Semua data masih mock seperti starter awal.

## Menjalankan project

```bash
npm install
npm run dev
```

Buka URL dari Vite, biasanya `http://localhost:5173`.

## Login demo

Pilih salah satu akun, lalu isi password dengan teks apa pun untuk masuk. Ini hanya simulasi frontend. Autentikasi sebenarnya nanti harus dilakukan oleh Laravel API.

## File yang paling relevan

- `src/screens/LoginPage.jsx`
- `src/screens/DashboardPage.jsx`
- `src/components/layout/AppShell.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/TopBar.jsx`
- `src/styles/global.css`
- `src/styles/tokens.css`

## Backend tahap berikutnya

Struktur yang disarankan tetap:

```text
React/Vite -> Laravel REST API -> MySQL
```

Password, role authorization, approval workflow, upload file, export, dan logic database jangan diletakkan di frontend.
