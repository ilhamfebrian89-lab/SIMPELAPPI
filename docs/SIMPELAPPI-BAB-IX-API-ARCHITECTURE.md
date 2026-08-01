# BAB IX: API and System Architecture

## 9.1 Architectural Direction

SIMPELAPPI menggunakan arsitektur modular yang terpisah berdasarkan bounded context. Struktur backend harus didesain agar:

- domain business terisolasi
- API endpoint jelas per modul
- query dan command dipisah
- event driven integration dapat berkembang secara aman

## 9.2 Service Boundary

### Monitoring API

- /api/v1/monitoring
- /api/v1/monitoring/{id}
- /api/v1/monitoring/submit

### Audit API

- /api/v1/audit
- /api/v1/audit/{id}
- /api/v1/audit/approval

### Surveilans API

- /api/v1/surveilans
- /api/v1/surveilans/{id}
- /api/v1/surveilans/hai

### PPRA API

- /api/v1/ppra
- /api/v1/ppra/antibiotic
- /api/v1/ppra/resistance

### Training API

- /api/v1/training
- /api/v1/training/participant

## 9.3 Integration Pattern

SIMPELAPPI harus mampu terintegrasi dengan:

- SIMRS
- LIS
- HRIS
- SSO/LDAP
- email notification
- WhatsApp notification

## 9.4 Event Flow

MonitoringCompleted -> Dashboard Update -> Notification -> Report Generation

## 9.5 Data Ownership

- Monitoring data dimiliki oleh Monitoring Context
- Audit data dimiliki oleh Audit Context
- HAI data dimiliki oleh Surveillance Context
- Report data dihasilkan dari query layer yang terpisah

## 9.6 Non-Functional Requirements

- response time < 3 detik untuk dashboard utama
- real-time update pada threshold tertentu
- audit trail untuk seluruh perubahan data
- role-based access control
- API versioning

## 9.7 Recommended Stack

- Frontend: React / Next.js / Bootstrap
- Backend: .NET / Node.js / Laravel
- Database: PostgreSQL / SQL Server
- Cache: Redis
- Message Broker: RabbitMQ / Kafka
- Storage: S3-compatible object storage

## 9.8 Kesimpulan

Arsitektur API SIMPELAPPI harus mengedepankan boundary domain, kepastian ownership data, serta kemampuan event-driven untuk mendukung dashboard real-time dan integrasi rumah sakit.
