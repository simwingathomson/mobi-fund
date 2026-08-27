# MobiFund API

Base URL: `http://localhost:4000`

Swagger UI: `/docs`

## Authentication

All protected routes require:

```http
Authorization: Bearer <accessToken>
```

Roles:

- `CUSTOMER`: mobile app customers.
- `LOAN_OFFICER`: operational staff.
- `ADMIN`: full management access.

## Core Routes

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register customer and profile |
| POST | `/auth/login` | Public | Issue JWT |
| GET | `/loan-products` | Public | List loan products |
| GET | `/customer/profile` | Customer | View profile, KYC documents, loans, schedules |
| POST | `/customer/documents` | Customer | Store KYC document metadata after private file upload |
| GET | `/loans/products` | Customer | List loan products |
| POST | `/loans/apply` | Customer | Submit loan application |
| GET | `/loans/mine` | Customer | View customer loans |
| GET | `/loans/:id/balance` | Customer | Calculate outstanding balance |
| GET | `/admin/dashboard` | Admin/officer | Operational KPIs |
| GET | `/admin/customers` | Admin/officer | Search customers and KYC |
| GET | `/admin/loans` | Admin/officer | View all loan applications |
| GET | `/admin/payments` | Admin/officer | View repayment transactions |
| GET | `/admin/reports` | Admin/officer | Export-ready report payload |
| PATCH | `/admin/customers/:id/approve` | Admin/officer | Approve KYC |
| PATCH | `/admin/customers/:id/reject` | Admin/officer | Reject KYC |
| POST | `/admin/loan-products` | Admin/officer | Create loan product |
| PATCH | `/admin/loans/:id/approve` | Admin/officer | Approve or modify amount |
| PATCH | `/admin/loans/:id/reject` | Admin/officer | Reject loan |
| POST | `/admin/loans/:id/disburse` | Admin/officer | Mark loan as manually disbursed |
| PATCH | `/admin/payments/confirm` | Admin/officer | Confirm submitted repayment reference |
| POST | `/payments/collect` | Customer | Submit repayment reference for admin confirmation |
| GET | `/payments/receipts/:reference` | Customer | View receipt metadata |

## Manual Repayment Body

```json
{
  "loanId": "loan_uuid",
  "amount": 150,
  "paymentMethod": "Manual transfer",
  "transactionReference": "BANK-REF-12345"
}
```

## Security Checklist

- Passwords are hashed with bcrypt.
- DTO validation is enabled globally with whitelisting and forbidden unknown fields.
- Admin routes are protected by JWT plus role checks.
- Keep Neon database credentials server-only.
- Store KYC files and receipts in private object storage before launch.
- Production should add rate limiting, refresh tokens, structured audit middleware, and request logging.
