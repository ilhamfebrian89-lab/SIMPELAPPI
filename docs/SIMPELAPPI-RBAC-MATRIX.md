# SIMPELAPPI RBAC Matrix

## Tujuan

Dokumen ini memetakan akses endpoint per role agar implementasi authorization konsisten antara backend, frontend, dan QA.

Legend:

- ALLOW: role dapat mengakses endpoint
- DENY: role tidak dapat mengakses endpoint
- OWN-UNIT: hanya data unit milik user

## Role Definition

- DIRECTOR
- PPI_CHAIR
- IPCN
- IPCLN
- UNIT_HEAD
- ADMIN

## Endpoint Access Matrix

| Endpoint | Method | DIRECTOR | PPI_CHAIR | IPCN | IPCLN | UNIT_HEAD | ADMIN | Catatan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /api/v1/auth/login | POST | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | Public auth endpoint |
| /api/v1/dashboard/kpi | GET | ALLOW | ALLOW | ALLOW | OWN-UNIT | OWN-UNIT | ALLOW | Filter unit_id by policy |
| /api/v1/monitoring | POST | DENY | ALLOW | ALLOW | ALLOW | DENY | ALLOW | IPCLN fokus input monitoring |
| /api/v1/monitoring/{id}/submit | POST | DENY | ALLOW | ALLOW | ALLOW | DENY | ALLOW | Submit dari creator atau supervisor |
| /api/v1/audit | POST | DENY | ALLOW | ALLOW | DENY | DENY | ALLOW | Audit operasional |
| /api/v1/audit/{id}/approval | POST | DENY | ALLOW | ALLOW | DENY | DENY | ALLOW | Approval utama oleh PPI_CHAIR |
| /api/v1/rtl | POST | DENY | ALLOW | ALLOW | DENY | ALLOW | ALLOW | UNIT_HEAD boleh buat RTL unit |
| /api/v1/rtl/{id}/progress | PATCH | DENY | ALLOW | ALLOW | DENY | OWN-UNIT | ALLOW | UNIT_HEAD hanya RTL unit sendiri |
| /api/v1/surveilans/cases | POST | DENY | ALLOW | ALLOW | DENY | DENY | ALLOW | IPCN utama untuk surveilans |
| /api/v1/notifications | GET | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | Hanya notifikasi user terkait |
| /api/v1/notifications/{id}/read | PATCH | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | Hanya owner notification |
| /api/v1/reports/audit-summary | GET | ALLOW | ALLOW | ALLOW | OWN-UNIT | OWN-UNIT | ALLOW | Read model/reporting |

## Policy Rules

1. Endpoint write harus memeriksa role dan ownership data.
2. Role IPCLN dibatasi pada monitoring dan notifikasi.
3. DIRECTOR default read-only pada dashboard dan report.
4. ADMIN tidak otomatis bypass semua data; tetap diaudit dan dibatasi sesuai kebutuhan operasional.
5. Semua akses DENY harus mengembalikan HTTP 403 dengan code AUTH-403.

## QA Checklist RBAC

- Uji tiap endpoint dengan token role berbeda.
- Pastikan OWN-UNIT gagal saat akses lintas unit.
- Validasi audit trail mencatat role_code dan action.
- Verifikasi tidak ada endpoint write yang terbuka untuk DIRECTOR tanpa policy khusus.
