# SIMPELAPPI UI Design Specification

## 1. Design Philosophy

SIMPELAPPI menerapkan prinsip Clean Enterprise Design:

- bersih
- modern
- fokus pada pekerjaan
- sedikit warna
- banyak whitespace
- mobile first

## 2. Design System

### Color Token

- Primary: #2563eb
- Secondary: #64748b
- Success: #16a34a
- Warning: #d97706
- Danger: #dc2626
- Background: #f4f7fb
- Surface: #ffffff

### Typography

- Heading: 32px / 700
- Subheading: 24px / 700
- Title: 18px / 600
- Body: 14px / 400
- Caption: 12px / 500

### Spacing

- 4, 8, 12, 16, 24, 32

### Components

- Button
- Input
- Card
- Badge
- Alert
- Table
- Timeline
- Modal
- Drawer
- Calendar
- Progress
- Avatar
- Chip
- Wizard
- Notification

## 3. Screen Flow

Login -> Dashboard -> Task -> Form -> Validation -> Success -> Back to Dashboard

## 4. UX Standard

- maksimal 3 klik menuju fungsi utama
- dashboard mengarah ke action hari ini
- monitoring harus sederhana untuk penggunaan mobile
- setiap form memiliki pola konsisten: identitas, checklist, foto, catatan, submit
- error state harus jelas dan human friendly

## 5. Developer Handoff

Prototype ini dibuat sebagai acuan awal untuk:

- UI designer
- frontend developer
- backend developer

Halaman Kewaspadaan Isolasi menyediakan mode audit dan supervisi untuk 14 kategori standar. Daftar kategori disimpan terpusat pada `monitoring.js` agar dapat diganti dengan nomenklatur resmi rumah sakit tanpa mengubah struktur formulir.
- QA
- product manager
