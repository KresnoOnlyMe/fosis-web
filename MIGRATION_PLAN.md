# Rencana Migrasi FOSIS Admin: Kotlin Mobile → React/Vite + Laravel + MySQL

## 1. Inventaris modul dari source Kotlin

- Login & pemilihan akun staf
- Dashboard + KPI + export
- Troubleshoot
- Maintenance
- Perijinan / SIK
- Administrasi
- Alur Kerja 4-Tier
- Kendaraan / GPS / logbook
- Chat Lapangan
- Akses Tim / RBAC
- Dialog Tambah Tiket
- Dialog Detail Tiket
- 2FA
- Running Jobs
- Urgent Alert

## 2. Mapping responsive

### Desktop (>= 840px)
- Sidebar tetap 260px
- Topbar di kanan sidebar
- Konten memanfaatkan lebar penuh
- Tabel horizontal tetap bisa scroll bila data lebar

### Tablet (600–839px)
- Sidebar menjadi navigation rail
- Label menu disembunyikan/diringkas
- Grid turun menjadi 1–2 kolom

### Mobile (< 600px)
- Sidebar disembunyikan
- Hamburger membuka drawer
- Bottom navigation: Troubleshoot / Maintenance / Administrasi
- Dialog dan form berubah menjadi 1 kolom

## 3. Design tokens dari Android

- Primary: #4F46E5
- Primary Container: #EEF2FF
- Secondary: #0284C7
- Tertiary: #059669
- Background: #F8FAFC
- Surface: #FFFFFF
- Outline: #CBD5E1
- Error: #DC2626
- Radius dominan: 12 / 14 / 16 / 20 / 24 px

## 4. Arsitektur frontend yang disarankan

```text
src/
├─ app/               # bila nanti memakai router/provider terpisah
├─ components/
│  ├─ layout/
│  ├─ ui/
│  ├─ dialogs/
│  └─ forms/
├─ features/
│  ├─ auth/
│  ├─ dashboard/
│  ├─ troubleshoot/
│  ├─ maintenance/
│  ├─ permits/
│  ├─ administration/
│  ├─ workflow/
│  ├─ vehicles/
│  ├─ chat/
│  └─ users/
├─ services/
│  ├─ api.js
│  ├─ auth.service.js
│  ├─ ticket.service.js
│  └─ ...
├─ hooks/
├─ constants/
├─ styles/
└─ utils/
```

Starter saat ini dibuat lebih sederhana agar mudah dibaca; ketika API Laravel mulai dibuat, pecah setiap screen menjadi `features/*`.

## 5. Mapping entity Room → MySQL

### `fosis_items`
Kolom inti: id, ticket_no, type, title, month, year, workflow_status, is_locked, is_urgent, kegiatan, requestor, maintenance_status, task_type, material_used, otdr_pdf_attachments, infra_category, infra_activity, root_cause, impact, service_impact, sla_status, cr_status, mitra, category, tanggal, admin_task, sub_task, sub_task_1, via_channel, admin_status, admin_kategori, admin_activity, engineer_name, engineer_email, site_location_name, latitude, longitude, encrypted_secret_notes, audit timestamps, signature hash, is_synced, timestamps.

### Tabel lain
- users
- permits
- vehicle_logs
- chat_messages
- audit_logs
- sync_queue

## 6. Endpoint Laravel tahap pertama

```text
POST   /api/login
POST   /api/logout
GET    /api/me
GET    /api/items
POST   /api/items
GET    /api/items/{id}
PUT    /api/items/{id}
DELETE /api/items/{id}
POST   /api/items/{id}/submit
POST   /api/items/{id}/verify
POST   /api/items/{id}/lock
POST   /api/items/{id}/approve
GET    /api/permits
POST   /api/permits
GET    /api/vehicles
POST   /api/vehicles
GET    /api/chat/messages
POST   /api/chat/messages
GET    /api/users
```

## 7. Urutan pengerjaan aman

1. Bekukan UI Android sebagai referensi: screenshot semua layar desktop-equivalent, tablet, mobile.
2. Selesaikan seluruh halaman React memakai mock data.
3. Samakan spacing, warna, typography, button, table, modal, dan state kosong.
4. Tambahkan routing URL (React Router) setelah struktur screen stabil.
5. Buat Laravel API + MySQL schema.
6. Integrasikan auth.
7. Integrasikan CRUD ticket.
8. Integrasikan SIK, kendaraan, chat, RBAC.
9. Integrasikan upload/export/PDF/Excel/PPT.
10. QA responsive + permission + workflow 4-tier.

## 8. Hal yang sebaiknya tidak dipindahkan mentah ke frontend

- Password/PIN user
- Kunci AES/encryption secret
- Pembuatan digital signature hash
- Aturan otorisasi final
- Export file sensitif
- Validasi approval/lock

Semua itu harus ditegakkan juga di Laravel agar user tidak dapat melewati aturan melalui browser/devtools.
