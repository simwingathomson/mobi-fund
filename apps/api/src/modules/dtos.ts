import { DocumentType } from '@prisma/client';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsPhoneNumber, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString() name!: string;
  @IsPhoneNumber() phone!: string;
  @IsEmail() email!: string;
  @MinLength(8) password!: string;
  @IsString() nrcNumber!: string;
  @IsString() address!: string;
  @IsString() employment!: string;
  @IsOptional() @IsPhoneNumber() repaymentPhone?: string;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

export class CreateLoanProductDto {
  @IsString() name!: string;
  @IsNumber() @Min(1) minimumAmount!: number;
  @IsNumber() @Min(1) maximumAmount!: number;
  @IsNumber() @Min(0) @Max(100) interestRate!: number;
  @IsNumber() @Min(1) durationDays!: number;
  @IsNumber() @Min(0) fees!: number;
}

export class ApplyLoanDto {
  @IsUUID() loanProductId!: string;
  @IsNumber() @Min(1) amount!: number;
}

export class ApproveLoanDto {
  @IsOptional() @IsNumber() @Min(1) approvedAmount?: number;
}

export class UploadDocumentDto {
  @IsEnum(DocumentType) documentType!: DocumentType;
  @IsString() fileUrl!: string;
}

export class PaymentDto {
  @IsUUID() loanId!: string;
  @IsNumber() @Min(1) amount!: number;
  @IsString() paymentMethod!: string;
  @IsString() transactionReference!: string;
}

export class ConfirmPaymentDto {
  @IsString() transactionReference!: string;
  @IsOptional() @IsString() receiptUrl?: string;
}
