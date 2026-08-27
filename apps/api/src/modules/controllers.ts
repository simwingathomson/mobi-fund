import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role, VerificationStatus } from '@prisma/client';
import { CurrentUser, JwtGuard, Roles, RolesGuard } from './authz';
import { ApplyLoanDto, ApproveLoanDto, ConfirmPaymentDto, CreateLoanProductDto, LoginDto, PaymentDto, RegisterDto, UploadDocumentDto } from './dtos';
import { AdminService, AuthService, CustomerService, DisbursementService, LoansService, PaymentsService } from './services';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
}

@UseGuards(JwtGuard)
@Controller('customer')
export class CustomerController {
  constructor(private customer: CustomerService) {}
  @Get('profile') profile(@CurrentUser() user: any) { return this.customer.profile(user.sub); }
  @Post('documents') uploadDocument(@CurrentUser() user: any, @Body() dto: UploadDocumentDto) { return this.customer.uploadDocument(user.sub, dto); }
}

@Controller('loan-products')
export class LoanProductsController {
  constructor(private loans: LoansService) {}
  @Get() products() { return this.loans.products(); }
}

@UseGuards(JwtGuard)
@Controller('loans')
export class LoansController {
  constructor(private loans: LoansService) {}
  @Get('products') products() { return this.loans.products(); }
  @Post('apply') apply(@CurrentUser() user: any, @Body() dto: ApplyLoanDto) { return this.loans.apply(user.sub, dto); }
  @Get('mine') mine(@CurrentUser() user: any) { return this.loans.mine(user.sub); }
  @Get(':id/balance') balance(@Param('id') id: string) { return this.loans.outstandingBalance(id); }
}

@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN, Role.LOAN_OFFICER)
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService, private loans: LoansService, private disbursements: DisbursementService) {}
  @Get('dashboard') dashboard() { return this.admin.dashboard(); }
  @Get('customers') customers(@Query('search') search?: string) { return this.admin.customers(search); }
  @Get('loans') loans() { return this.loans.all(); }
  @Get('payments') payments() { return this.admin.payments(); }
  @Get('reports') reports() { return this.admin.reports(); }
  @Patch('customers/:id/approve') approveCustomer(@Param('id') id: string) { return this.admin.verifyCustomer(id, VerificationStatus.APPROVED); }
  @Patch('customers/:id/reject') rejectCustomer(@Param('id') id: string) { return this.admin.verifyCustomer(id, VerificationStatus.REJECTED); }
  @Post('loan-products') createProduct(@Body() dto: CreateLoanProductDto) { return this.loans.createProduct(dto); }
  @Patch('loans/:id/approve') approveLoan(@Param('id') id: string, @Body() dto: ApproveLoanDto) { return this.loans.approve(id, dto); }
  @Patch('loans/:id/reject') rejectLoan(@Param('id') id: string) { return this.loans.reject(id); }
  @Post('loans/:id/disburse') disburseLoan(@Param('id') id: string) { return this.disbursements.disburseLoan(id); }
  @Patch('payments/confirm') confirmPayment(@Body() dto: ConfirmPaymentDto) { return this.payments.confirm(dto); }
}

@UseGuards(JwtGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}
  @Post('collect') collect(@Body() dto: PaymentDto) { return this.payments.collect(dto); }
  @Get('receipts/:reference') receipt(@Param('reference') reference: string) { return this.payments.receipt(reference); }
}
