import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminController, AuthController, CustomerController, LoanProductsController, LoansController, PaymentsController } from './controllers';
import { JwtGuard, RolesGuard } from './authz';
import { PrismaService } from './prisma.service';
import { AdminService, AuthService, CustomerService, DisbursementService, LoansService, PaymentsService } from './services';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), JwtModule.register({ secret: process.env.JWT_SECRET ?? 'dev-secret' })],
  controllers: [AuthController, CustomerController, LoanProductsController, LoansController, AdminController, PaymentsController],
  providers: [PrismaService, JwtGuard, RolesGuard, AuthService, CustomerService, LoansService, AdminService, PaymentsService, DisbursementService]
})
export class AppModule {}
