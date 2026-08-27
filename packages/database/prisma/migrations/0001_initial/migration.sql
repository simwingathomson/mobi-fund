CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN', 'LOAN_OFFICER');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "DocumentType" AS ENUM ('NATIONAL_ID', 'SELFIE', 'PROOF_OF_ADDRESS', 'LOAN_AGREEMENT', 'RECEIPT');
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'ACTIVE', 'PAID', 'DEFAULTED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CustomerProfile" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "nrcNumber" TEXT NOT NULL UNIQUE,
  "address" TEXT NOT NULL,
  "employment" TEXT NOT NULL,
  "repaymentPhone" TEXT,
  "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Document" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "customerId" TEXT NOT NULL REFERENCES "CustomerProfile"("id") ON DELETE CASCADE,
  "documentType" "DocumentType" NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LoanProduct" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "minimumAmount" DECIMAL(12,2) NOT NULL,
  "maximumAmount" DECIMAL(12,2) NOT NULL,
  "interestRate" DECIMAL(5,2) NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "fees" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Loan" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "customerId" TEXT NOT NULL REFERENCES "CustomerProfile"("id"),
  "loanProductId" TEXT NOT NULL REFERENCES "LoanProduct"("id"),
  "amount" DECIMAL(12,2) NOT NULL,
  "interest" DECIMAL(12,2) NOT NULL,
  "totalRepayment" DECIMAL(12,2) NOT NULL,
  "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
  "approvedDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Payment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "loanId" TEXT NOT NULL REFERENCES "Loan"("id"),
  "amount" DECIMAL(12,2) NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "transactionReference" TEXT NOT NULL UNIQUE,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "receiptUrl" TEXT
);

CREATE TABLE "RepaymentSchedule" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "loanId" TEXT NOT NULL REFERENCES "Loan"("id") ON DELETE CASCADE,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Notification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "message" TEXT NOT NULL,
  "readStatus" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "actorId" TEXT REFERENCES "User"("id"),
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
