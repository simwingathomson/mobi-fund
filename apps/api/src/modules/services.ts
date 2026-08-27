import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoanStatus, PaymentStatus, Role, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ApplyLoanDto, ApproveLoanDto, ConfirmPaymentDto, CreateLoanProductDto, LoginDto, PaymentDto, RegisterDto, UploadDocumentDto } from './dtos';
import { PrismaService } from './prisma.service';
import { addDays } from './time';

@Injectable()
export class AuthService {
  private jwt: JwtService;

  constructor(private prisma: PrismaService, config: ConfigService) {
    this.jwt = new JwtService({ secret: config.get<string>('JWT_SECRET') ?? 'dev-secret' });
  }

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        profile: {
          create: {
            nrcNumber: dto.nrcNumber,
            address: dto.address,
            employment: dto.employment,
            repaymentPhone: dto.repaymentPhone
          }
        }
      },
      include: { profile: true }
    });
    await this.prisma.auditLog.create({ data: { actorId: user.id, action: 'CUSTOMER_REGISTERED', entity: 'User', entityId: user.id } });
    return this.session(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email }, include: { profile: true } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    return this.session(user);
  }

  private session(user: { id: string; email: string; role: Role; name: string }) {
    return {
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
      accessToken: this.jwt.sign({ sub: user.id, email: user.email, role: user.role, name: user.name })
    };
  }
}

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  products() {
    return this.prisma.loanProduct.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  }

  async createProduct(dto: CreateLoanProductDto) {
    return this.prisma.loanProduct.create({ data: dto });
  }

  all() {
    return this.prisma.loan.findMany({
      include: { customer: { include: { user: true } }, loanProduct: true, payments: true, schedules: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async apply(userId: string, dto: ApplyLoanDto) {
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Customer profile not found');
    if (profile.verificationStatus !== VerificationStatus.APPROVED) throw new BadRequestException('KYC must be approved before applying');
    const product = await this.prisma.loanProduct.findUnique({ where: { id: dto.loanProductId } });
    if (!product) throw new NotFoundException('Loan product not found');
    const min = Number(product.minimumAmount);
    const max = Number(product.maximumAmount);
    if (dto.amount < min || dto.amount > max) throw new BadRequestException(`Amount must be between ${min} and ${max}`);
    const interest = dto.amount * (Number(product.interestRate) / 100);
    const totalRepayment = dto.amount + interest + Number(product.fees);
    const loan = await this.prisma.loan.create({
      data: {
        customerId: profile.id,
        loanProductId: product.id,
        amount: dto.amount,
        interest,
        totalRepayment,
        dueDate: addDays(new Date(), product.durationDays)
      }
    });
    await this.prisma.auditLog.create({ data: { actorId: userId, action: 'LOAN_APPLIED', entity: 'Loan', entityId: loan.id, metadata: { amount: dto.amount, loanProductId: product.id } } });
    return loan;
  }

  mine(userId: string) {
    return this.prisma.loan.findMany({
      where: { customer: { userId } },
      include: { loanProduct: true, payments: true, schedules: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approve(id: string, dto: ApproveLoanDto) {
    const loan = await this.prisma.loan.findUnique({ where: { id }, include: { loanProduct: true } });
    if (!loan) throw new NotFoundException('Loan not found');
    const amount = dto.approvedAmount ?? Number(loan.amount);
    const interest = amount * (Number(loan.loanProduct.interestRate) / 100);
    const totalRepayment = amount + interest + Number(loan.loanProduct.fees);
    const updated = await this.prisma.loan.update({
      where: { id },
      data: { amount, interest, totalRepayment, status: LoanStatus.APPROVED, approvedDate: new Date() }
    });
    await this.createRepaymentSchedule(id, totalRepayment, loan.loanProduct.durationDays);
    await this.prisma.auditLog.create({ data: { action: 'LOAN_APPROVED', entity: 'Loan', entityId: id, metadata: { approvedAmount: amount } } });
    return updated;
  }

  async reject(id: string) {
    const rejected = await this.prisma.loan.update({ where: { id }, data: { status: LoanStatus.REJECTED } });
    await this.prisma.auditLog.create({ data: { action: 'LOAN_REJECTED', entity: 'Loan', entityId: id } });
    return rejected;
  }

  async outstandingBalance(loanId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId }, include: { payments: true } });
    if (!loan) throw new NotFoundException('Loan not found');
    const paid = loan.payments.filter(p => p.status === PaymentStatus.CONFIRMED).reduce((sum, p) => sum + Number(p.amount), 0);
    return Math.max(Number(loan.totalRepayment) - paid, 0);
  }

  private async createRepaymentSchedule(loanId: string, total: number, durationDays: number) {
    await this.prisma.repaymentSchedule.deleteMany({ where: { loanId } });
    const installments = durationDays <= 31 ? 4 : 12;
    const amount = Number((total / installments).toFixed(2));
    await this.prisma.repaymentSchedule.createMany({
      data: Array.from({ length: installments }, (_, index) => ({
        loanId,
        amount,
        dueDate: addDays(new Date(), Math.ceil(((index + 1) * durationDays) / installments))
      }))
    });
  }
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [customers, activeLoans, pendingApplications, payments, loans] = await Promise.all([
      this.prisma.customerProfile.count(),
      this.prisma.loan.count({ where: { status: { in: [LoanStatus.ACTIVE, LoanStatus.DISBURSED] } } }),
      this.prisma.loan.count({ where: { status: LoanStatus.PENDING } }),
      this.prisma.payment.findMany({ where: { status: PaymentStatus.CONFIRMED } }),
      this.prisma.loan.findMany()
    ]);
    return {
      totalCustomers: customers,
      activeLoans,
      pendingApplications,
      totalRepayments: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      totalDisbursedAmount: loans.filter(l => [LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.PAID].includes(l.status)).reduce((sum, l) => sum + Number(l.amount), 0),
      outstandingLoans: loans.reduce((sum, l) => sum + Number(l.totalRepayment), 0)
    };
  }

  customers(search?: string) {
    return this.prisma.customerProfile.findMany({
      where: search ? { user: { OR: [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] } } : undefined,
      include: { user: true, documents: true, loans: true }
    });
  }

  verifyCustomer(id: string, status: VerificationStatus) {
    return this.prisma.customerProfile.update({ where: { id }, data: { verificationStatus: status } });
  }

  payments() {
    return this.prisma.payment.findMany({ include: { loan: { include: { customer: { include: { user: true } } } } }, orderBy: { paymentDate: 'desc' } });
  }

  async reports() {
    const [customers, loans, payments] = await Promise.all([
      this.customers(),
      this.prisma.loan.findMany({ include: { customer: { include: { user: true } }, payments: true } }),
      this.payments()
    ]);
    return { generatedAt: new Date().toISOString(), customers, loans, payments };
  }
}

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  profile(userId: string) {
    return this.prisma.customerProfile.findUnique({
      where: { userId },
      include: { user: true, documents: true, loans: { include: { loanProduct: true, payments: true, schedules: true } } }
    });
  }

  async uploadDocument(userId: string, dto: UploadDocumentDto) {
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Customer profile not found');
    return this.prisma.document.create({
      data: {
        customerId: profile.id,
        documentType: dto.documentType,
        fileUrl: dto.fileUrl
      }
    });
  }
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async collect(dto: PaymentDto) {
    const loan = await this.prisma.loan.findUnique({ where: { id: dto.loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    const allowedStatuses: LoanStatus[] = [
  LoanStatus.DISBURSED,
  LoanStatus.ACTIVE,
];

if (!allowedStatuses.includes(loan.status)) {
  throw new BadRequestException(
    'Repayments can only be recorded for disbursed or active loans',
  );
}
    const payment = await this.prisma.payment.create({
      data: {
        loanId: dto.loanId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        transactionReference: dto.transactionReference,
        status: PaymentStatus.PENDING
      }
    });
    await this.prisma.auditLog.create({ data: { action: 'PAYMENT_SUBMITTED', entity: 'Payment', entityId: payment.id, metadata: { reference: dto.transactionReference } } });
    return payment;
  }

  async confirm(dto: ConfirmPaymentDto) {
    const payment = await this.prisma.payment.update({
      where: { transactionReference: dto.transactionReference },
      data: { status: PaymentStatus.CONFIRMED, paymentDate: new Date(), receiptUrl: dto.receiptUrl }
    });
    const remaining = await this.remainingForLoan(payment.loanId);
    if (remaining <= 0) await this.prisma.loan.update({ where: { id: payment.loanId }, data: { status: LoanStatus.PAID } });
    await this.prisma.auditLog.create({ data: { action: 'PAYMENT_CONFIRMED', entity: 'Payment', entityId: payment.id, metadata: { remaining } } });
    return { payment, remainingBalance: remaining };
  }

  receipt(reference: string) {
    return this.prisma.payment.findUnique({ where: { transactionReference: reference }, include: { loan: { include: { customer: { include: { user: true } } } } } });
  }

  private async remainingForLoan(loanId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId }, include: { payments: true } });
    if (!loan) return 0;
    const paid = loan.payments.filter(p => p.status === PaymentStatus.CONFIRMED).reduce((sum, p) => sum + Number(p.amount), 0);
    return Math.max(Number(loan.totalRepayment) - paid, 0);
  }
}

@Injectable()
export class DisbursementService {
  constructor(private prisma: PrismaService) {}

  async disburseLoan(loanId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.APPROVED) throw new BadRequestException('Only approved loans can be disbursed');
    const updated = await this.prisma.loan.update({ where: { id: loanId }, data: { status: LoanStatus.DISBURSED } });
    await this.prisma.auditLog.create({ data: { action: 'LOAN_DISBURSED_MANUALLY', entity: 'Loan', entityId: loanId } });
    return { loan: updated, message: 'Loan marked as disbursed. Record the external payout reference in your accounting process.' };
  }
}
