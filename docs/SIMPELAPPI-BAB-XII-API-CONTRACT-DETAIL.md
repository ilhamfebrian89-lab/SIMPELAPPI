# BAB XII: API Contract Detail

## 12.1 Tujuan

BAB XII mendefinisikan kontrak API operasional SIMPELAPPI dalam format implementable untuk frontend, backend, dan QA.

Fokus:

- endpoint utama per domain
- payload request dan response
- validasi minimum
- standar error response
- idempotency dan versioning

## 12.2 Standar Umum API

- Base URL: /api/v1
- Format data: application/json
- Timestamp: ISO-8601 UTC
- Auth: Bearer JWT
- Correlation ID: X-Correlation-Id wajib pada request gateway

Response envelope standar:

```json
{
  "success": true,
  "message": "string",
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-08-01T10:00:00Z"
  }
}
```

Error envelope standar:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "code": "VAL-001",
      "field": "unitId",
      "detail": "unitId is required"
    }
  ],
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-08-01T10:00:00Z"
  }
}
```

## 12.3 Authentication API

### POST /api/v1/auth/login

Request:

```json
{
  "username": "ipcn_admin",
  "password": "***"
}
```

Response 200:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 3600,
    "user": {
      "userId": "uuid",
      "fullName": "Indah Permata",
      "roleCode": "IPCN",
      "unitId": "uuid"
    }
  }
}
```

## 12.4 Monitoring API Contract

### POST /api/v1/monitoring

Kegunaan: membuat draft monitoring.

Request:

```json
{
  "monitoringDate": "2026-08-01",
  "unitId": "uuid",
  "observerUserId": "uuid",
  "templateId": "uuid",
  "items": [
    {
      "questionCode": "HH-01",
      "answerValue": "yes",
      "scoreValue": 1,
      "note": "Patuh"
    }
  ]
}
```

Validasi minimum:

- monitoringDate wajib
- unitId wajib
- items minimal 1

Response 201:

```json
{
  "success": true,
  "message": "Monitoring draft created",
  "data": {
    "monitoringId": "uuid",
    "monitoringNo": "MTR000123",
    "status": "draft"
  }
}
```

### POST /api/v1/monitoring/{monitoringId}/submit

Kegunaan: submit monitoring.

Request:

```json
{
  "submittedBy": "uuid"
}
```

Response 200:

```json
{
  "success": true,
  "message": "Monitoring submitted",
  "data": {
    "monitoringId": "uuid",
    "status": "submitted",
    "submittedAt": "2026-08-01T11:20:00Z"
  }
}
```

## 12.5 Audit API Contract

### POST /api/v1/audit

Request:

```json
{
  "auditDate": "2026-08-01",
  "unitId": "uuid",
  "auditorUserId": "uuid",
  "findings": [
    {
      "findingCategory": "Hand Hygiene",
      "findingDetail": "Kepatuhan transfer pasien belum stabil",
      "severityLevel": "medium"
    }
  ],
  "recommendations": [
    {
      "recommendationText": "Pembinaan lintas shift",
      "dueDate": "2026-08-05"
    }
  ]
}
```

Response 201:

```json
{
  "success": true,
  "message": "Audit created",
  "data": {
    "auditId": "uuid",
    "auditNo": "AUD000778",
    "status": "draft"
  }
}
```

### POST /api/v1/audit/{auditId}/approval

Request:

```json
{
  "approverUserId": "uuid",
  "approvalStatus": "approved",
  "approvalNote": "Lanjutkan ke RTL"
}
```

Response 200:

```json
{
  "success": true,
  "message": "Audit approval recorded",
  "data": {
    "auditId": "uuid",
    "approvalStatus": "approved"
  }
}
```

## 12.6 RTL API Contract

### POST /api/v1/rtl

Request:

```json
{
  "sourceType": "audit",
  "sourceId": "uuid",
  "rtlTitle": "Peningkatan kepatuhan hand hygiene",
  "picUserId": "uuid",
  "unitId": "uuid",
  "dueDate": "2026-08-10"
}
```

Response 201:

```json
{
  "success": true,
  "message": "RTL created",
  "data": {
    "rtlId": "uuid",
    "rtlNo": "RTL000321",
    "status": "open"
  }
}
```

### PATCH /api/v1/rtl/{rtlId}/progress

Request:

```json
{
  "progressPercent": 68,
  "comment": "Pembinaan sudah berjalan",
  "updatedBy": "uuid"
}
```

Response 200:

```json
{
  "success": true,
  "message": "RTL progress updated",
  "data": {
    "rtlId": "uuid",
    "progressPercent": 68,
    "status": "in_progress"
  }
}
```

## 12.7 Surveillance API Contract

### POST /api/v1/surveilans/cases

Request:

```json
{
  "mrn": "MRN-20481",
  "fullName": "Ayu Lestari",
  "unitId": "uuid",
  "diagnosisText": "Pneumonia nosokomial",
  "haiTypeCode": "VAP",
  "organismName": "Klebsiella pneumoniae"
}
```

Response 201:

```json
{
  "success": true,
  "message": "Surveillance case created",
  "data": {
    "caseId": "uuid",
    "caseNo": "CAS000901",
    "status": "open"
  }
}
```

## 12.8 Notification API Contract

### GET /api/v1/notifications

Query:

- page default 1
- size default 20
- isRead optional

Response 200:

```json
{
  "success": true,
  "message": "Notifications loaded",
  "data": [
    {
      "notificationId": "uuid",
      "title": "Audit belum divalidasi",
      "body": "3 audit membutuhkan validasi",
      "sourceType": "audit",
      "sourceId": "uuid",
      "isRead": false,
      "createdAt": "2026-08-01T08:40:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "size": 20,
    "total": 45
  }
}
```

### PATCH /api/v1/notifications/{notificationId}/read

Request:

```json
{
  "readBy": "uuid"
}
```

## 12.9 Dashboard and Report Query API

### GET /api/v1/dashboard/kpi?date=2026-08-01&unitId=uuid

Response mengambil dari read model support_reporting.dashboard_kpi_daily.

### GET /api/v1/reports/audit-summary?periodMonth=2026-08

Response mengambil dari read model support_reporting.audit_summary_monthly.

## 12.10 Error Code Standard

- AUTH-401: invalid token atau unauthorized
- AUTH-403: forbidden access
- VAL-001: required field missing
- VAL-002: invalid field format
- BIZ-409: business conflict, misalnya submit data yang sudah closed
- SYS-500: unexpected internal error

## 12.11 Idempotency and Concurrency

- Endpoint create kritikal menerima header Idempotency-Key.
- Update status menggunakan optimistic check via updated_at atau version.
- Jika konflik data, kembalikan HTTP 409 dengan code BIZ-409.

## 12.12 Mapping Endpoint to Table

- POST /monitoring -> core_monitoring.monitorings + monitoring_items
- POST /monitoring/{id}/submit -> core_monitoring.monitorings
- POST /audit -> core_audit.audits + audit_findings + audit_recommendations
- POST /audit/{id}/approval -> core_audit.audit_approvals + audits.status
- POST /rtl -> core_audit.rtls
- PATCH /rtl/{id}/progress -> core_audit.rtls + rtl_comments
- POST /surveilans/cases -> core_surveillance.patients + surveillance_cases + hai_events
- GET /dashboard/kpi -> support_reporting.dashboard_kpi_daily
- GET /notifications -> support_notification.notifications

## 12.13 Test Contract Checklist

- validasi field wajib
- validasi enum status
- idempotency key behavior
- authorization per role
- pagination metadata
- standard envelope consistency
- audit trail tercatat setelah write operation

## 12.14 Kesimpulan

Kontrak API pada BAB XII memberi satu sumber acuan lintas tim untuk implementasi endpoint, pengujian integrasi, dan quality gate sebelum deployment.
