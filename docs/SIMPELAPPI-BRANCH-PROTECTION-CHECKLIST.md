# SIMPELAPPI Branch Protection Checklist

## Tujuan

Dokumen ini menjadi acuan konfigurasi branch protection pada repository agar proses merge ke branch stabil selalu melalui quality gate.

## Branch yang Dilindungi

- main (atau master)
- release/* (jika digunakan)

## Checklist Konfigurasi

### A. Pull Request Rules

- [ ] Require a pull request before merging
- [ ] Require approvals: minimal 1 reviewer
- [ ] Dismiss stale approvals when new commits are pushed
- [ ] Require conversation resolution before merge
- [ ] Require linear history (opsional sesuai kebijakan)

### B. Status Checks

- [ ] Require status checks to pass before merging
- [ ] Wajib lulus workflow `SQL Migration Check`
- [ ] Wajib lulus workflow `Newman API Tests`
- [ ] Wajib lulus workflow `Release Gate`
- [ ] Require branches to be up to date before merging

### C. Restriction Rules

- [ ] Restrict who can push to matching branches
- [ ] Include administrators (opsional namun direkomendasikan)
- [ ] Block force pushes
- [ ] Block branch deletion

### D. Merge Strategy

- [ ] Allowed merge method ditetapkan (squash/rebase/merge commit)
- [ ] Auto-merge hanya untuk PR yang lulus semua gate

## Rekomendasi Praktik

- Gunakan CODEOWNERS untuk area kritikal (`database/`, `.github/workflows/`, `docs/openapi/`).
- Set reviewer wajib dari tim terkait:

  - DB migration: reviewer backend
  - CI workflow: reviewer DevOps
  - API contract: reviewer backend + QA

## Evidence Audit

Simpan bukti berikut untuk audit internal:

- screenshot konfigurasi branch protection
- log PR yang ditolak karena check gagal
- log PR yang lulus dengan check lengkap
- daftar reviewer dan approval history

## Verifikasi Berkala

Frekuensi minimal bulanan:

- validasi workflow masih aktif
- validasi rule protection tidak berubah tanpa persetujuan
- validasi tidak ada bypass merge tanpa approval
