import { PayrollRecord, PayrollStatus, BonusType, DeductionType } from '@repo/database';
import { Logger } from '@repo/utils/logger';
import { BusinessError } from '../../errors';
import { EventBus } from '../../events';
import { TransactionManager } from '../../transactions';
import { UserRepository } from '../../repositories/user';
import { z } from 'zod';

// Validation schemas
const payrollCalculationSchema = z.object({
  userId: z.string(),
  projectId: z.string(),
  period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
  hoursWorked: z.number().min(0),
  hourlyRate: z.number().min(0),
  bonuses: z.array(z.object({
    type: z.enum(['QUALITY', 'PERFORMANCE', 'PROJECT_COMPLETION', 'ATTENDANCE', 'OTHER']),
    amount: z.number().min(0),
    description: z.string()
  })).optional(),
  deductions: z.array(z.object({
    type: z.enum(['ABSENCE', 'DAMAGE', 'ADVANCE', 'OTHER']),
    amount: z.number().min(0),
    description: z.string()
  })).optional()
});

const payrollUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'CHECK']).optional(),
  paymentDate: z.date().optional(),
  bankReference: z.string().optional()
});

export interface PayrollSummary {
  totalPayroll: number;
  totalHours: number;
  averageHourlyRate: number;
  employeeCount: number;
  paidCount: number;
  pendingCount: number;
}

export interface PayrollDTO {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  period: string;
  hoursWorked: number;
  hourlyRate: number;
  baseSalary: number;
  bonuses: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
  }>;
  deductions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
  }>;
  netPay: number;
  status: string;
  paymentDate?: Date;
  paymentMethod?: string;
  tasksCompleted?: number;
  apartmentsCompleted?: string[];
}

export interface PayrollCreateInput {
  userId: string;
  projectId: string;
  period: string;
  hoursWorked: number;
  hourlyRate: number;
  bonuses?: Array<{
    type: BonusType;
    amount: number;
    description: string;
  }>;
  deductions?: Array<{
    type: DeductionType;
    amount: number;
    description: string;
  }>;
}

export interface PayrollUpdateInput {
  status?: PayrollStatus;
  paymentMethod?: string;
  paymentDate?: Date;
  bankReference?: string;
}

export interface PayrollQueryOptions {
  projectId?: string;
  period?: string;
  status?: PayrollStatus;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface IPayrollService {
  createPayrollRecord(data: PayrollCreateInput): Promise<PayrollDTO>;
  updatePayrollRecord(id: string, data: PayrollUpdateInput): Promise<PayrollDTO>;
  getPayrollByProject(projectId: string, period?: string): Promise<{ records: PayrollDTO[]; summary: PayrollSummary }>;
  getPayrollRecord(id: string): Promise<PayrollDTO | null>;
  calculatePayrollAmounts(data: PayrollCreateInput): PayrollCalculation;
  validatePayrollData(data: any): Promise<PayrollCreateInput>;
  generatePayrollSummary(records: PayrollDTO[]): PayrollSummary;
  bulkUpdatePayrollStatus(ids: string[], status: PayrollStatus): Promise<PayrollDTO[]>;
}

export interface PayrollCalculation {
  baseSalary: number;
  totalBonuses: number;
  totalDeductions: number;
  netPay: number;
}

export class PayrollService implements IPayrollService {
  private logger: Logger;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
    private readonly transactionManager: TransactionManager,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('PayrollService');
  }

  async createPayrollRecord(data: PayrollCreateInput): Promise<PayrollDTO> {
    try {
      // Validate input
      const validated = await this.validatePayrollData(data);
      
      // Check if user exists
      const user = await this.userRepository.findById(validated.userId);
      if (!user) {
        throw new BusinessError('User not found', undefined, 'NOT_FOUND', 404);
      }

      // Calculate amounts
      const calculation = this.calculatePayrollAmounts(validated);

      // Create payroll record (mocked for now - would use PayrollRepository)
      const payroll = {
        id: this.generateId(),
        userId: validated.userId,
        projectId: validated.projectId,
        period: validated.period,
        hoursWorked: validated.hoursWorked,
        hourlyRate: validated.hourlyRate,
        baseSalary: calculation.baseSalary,
        totalBonuses: calculation.totalBonuses,
        totalDeductions: calculation.totalDeductions,
        netPay: calculation.netPay,
        status: 'PENDING' as PayrollStatus,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        bonuses: validated.bonuses || [],
        deductions: validated.deductions || []
      };

      // Emit event
      await this.eventBus.emit('payroll.created', {
        payrollId: payroll.id,
        userId: payroll.userId,
        projectId: payroll.projectId,
        amount: payroll.netPay,
        timestamp: new Date()
      });

      this.logger.info(`Payroll record created: ${payroll.id}`);
      return this.mapToDTO(payroll, user);
    } catch (error) {
      this.logger.error('Error creating payroll record', error);
      throw error instanceof BusinessError ? error : new BusinessError('Failed to create payroll record', error);
    }
  }

  async updatePayrollRecord(id: string, data: PayrollUpdateInput): Promise<PayrollDTO> {
    try {
      // Validate input
      const validated = await payrollUpdateSchema.parseAsync(data);
      
      // Mock update (would use PayrollRepository)
      const updated = {
        id,
        ...validated,
        updatedAt: new Date()
      };

      // Emit event
      await this.eventBus.emit('payroll.updated', {
        payrollId: id,
        changes: validated,
        timestamp: new Date()
      });

      this.logger.info(`Payroll record updated: ${id}`);
      
      // Mock user data for now
      const mockUser = { id: 'user1', name: 'Employee', position: 'Worker' };
      return this.mapToDTO(updated as any, mockUser as any);
    } catch (error) {
      this.logger.error(`Error updating payroll record: ${id}`, error);
      throw error instanceof BusinessError ? error : new BusinessError('Failed to update payroll record', error);
    }
  }

  async getPayrollByProject(projectId: string, period?: string): Promise<{ records: PayrollDTO[]; summary: PayrollSummary }> {
    try {
      // Mock data for now - would use PayrollRepository
      const mockRecords = this.getMockPayrollData(projectId, period);
      
      const records = mockRecords.map(record => this.mapToDTO(record, record.user));
      const summary = this.generatePayrollSummary(records);

      this.logger.debug(`Retrieved ${records.length} payroll records for project ${projectId}`);
      return { records, summary };
    } catch (error) {
      this.logger.error(`Error getting payroll for project: ${projectId}`, error);
      throw new BusinessError('Failed to get project payroll', error);
    }
  }

  async getPayrollRecord(id: string): Promise<PayrollDTO | null> {
    try {
      // Mock implementation - would use PayrollRepository
      const mockRecord = this.getMockPayrollData('project1').find(r => r.id === id);
      if (!mockRecord) {
        return null;
      }

      return this.mapToDTO(mockRecord, mockRecord.user);
    } catch (error) {
      this.logger.error(`Error getting payroll record: ${id}`, error);
      throw new BusinessError('Failed to get payroll record', error);
    }
  }

  calculatePayrollAmounts(data: PayrollCreateInput): PayrollCalculation {
    const baseSalary = data.hoursWorked * data.hourlyRate;
    const totalBonuses = data.bonuses?.reduce((sum, b) => sum + b.amount, 0) || 0;
    const totalDeductions = data.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const netPay = baseSalary + totalBonuses - totalDeductions;

    return {
      baseSalary,
      totalBonuses,
      totalDeductions,
      netPay
    };
  }

  async validatePayrollData(data: any): Promise<PayrollCreateInput> {
    try {
      return await payrollCalculationSchema.parseAsync(data);
    } catch (error) {
      throw new BusinessError('Invalid payroll data', error, 'VALIDATION_ERROR', 400);
    }
  }

  generatePayrollSummary(records: PayrollDTO[]): PayrollSummary {
    return {
      totalPayroll: records.reduce((sum, r) => sum + r.netPay, 0),
      totalHours: records.reduce((sum, r) => sum + r.hoursWorked, 0),
      averageHourlyRate: records.length > 0 
        ? records.reduce((sum, r) => sum + r.hourlyRate, 0) / records.length 
        : 0,
      employeeCount: records.length,
      paidCount: records.filter(r => r.status === 'paid').length,
      pendingCount: records.filter(r => r.status === 'pending').length
    };
  }

  async bulkUpdatePayrollStatus(ids: string[], status: PayrollStatus): Promise<PayrollDTO[]> {
    try {
      // Mock implementation - would use PayrollRepository
      const updated = ids.map(id => ({
        id,
        status,
        updatedAt: new Date()
      }));

      // Emit events
      for (const record of updated) {
        await this.eventBus.emit('payroll.status_changed', {
          payrollId: record.id,
          status,
          timestamp: new Date()
        });
      }

      this.logger.info(`Bulk updated ${ids.length} payroll records to status: ${status}`);
      
      // Mock return data
      return updated.map(u => this.mapToDTO(u as any, { id: 'user1', name: 'Employee', position: 'Worker' } as any));
    } catch (error) {
      this.logger.error('Error in bulk update payroll status', error);
      throw new BusinessError('Failed to bulk update payroll status', error);
    }
  }

  private mapToDTO(record: any, user: any): PayrollDTO {
    return {
      id: record.id,
      employeeId: record.userId,
      employeeName: user?.name || 'Unknown',
      employeePosition: user?.position || 'Worker',
      period: record.period,
      hoursWorked: Number(record.hoursWorked),
      hourlyRate: Number(record.hourlyRate),
      baseSalary: Number(record.baseSalary || record.regularPay),
      bonuses: record.bonuses?.map((b: any, index: number) => ({
        id: String(index + 1),
        type: b.type || 'performance',
        amount: b.amount,
        description: b.description || 'Bonus'
      })) || [],
      deductions: record.deductions?.map((d: any, index: number) => ({
        id: String(index + 1),
        type: d.type || 'other',
        amount: d.amount,
        description: d.description || 'Deduction'
      })) || [],
      netPay: Number(record.netPay || record.totalNet),
      status: (record.status || 'pending').toLowerCase(),
      paymentDate: record.paymentDate || record.paidAt,
      paymentMethod: record.paymentMethod || 'bank_transfer',
      tasksCompleted: record.tasksCompleted || 5,
      apartmentsCompleted: record.apartmentsCompleted || ['A101', 'A102']
    };
  }

  private generateId(): string {
    return String(Date.now());
  }

  private getMockPayrollData(projectId: string, period?: string): any[] {
    // Mock data - would be replaced with actual repository calls
    return [
      {
        id: '1',
        userId: 'user1',
        projectId,
        period: '2024-01',
        hoursWorked: 160,
        hourlyRate: 25,
        regularPay: 4000,
        bonuses: 500,
        deductions: 200,
        totalNet: 4300,
        status: 'PAID',
        paidAt: new Date(),
        user: { id: 'user1', name: 'John Doe', position: 'Senior Worker' }
      },
      {
        id: '2',
        userId: 'user2',
        projectId,
        period: '2024-01',
        hoursWorked: 120,
        hourlyRate: 20,
        regularPay: 2400,
        bonuses: 0,
        deductions: 100,
        totalNet: 2300,
        status: 'PENDING',
        user: { id: 'user2', name: 'Jane Smith', position: 'Worker' }
      }
    ].filter(record => !period || record.period === period);
  }
}
