import { supabase } from '../supabaseClient';
import { PaymentAlert } from '../types';

// Interface for database query result
interface CaseWithClient {
  id: string;
  deceased_name: string;
  service_date?: string;
  payment_status: string;
  payment_due_date?: string;
  total_estimated_cost?: number;
  total_actual_cost?: number;
  parlor_id: string;
  clients: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }[];
}

export class PaymentAlertService {
  static async generateAlerts(parlorId: string): Promise<PaymentAlert[]> {
    // Get cases with payment and client information
    const { data: cases, error } = await supabase
      .from('cases')
      .select(`
        id,
        deceased_name,
        service_date,
        payment_status,
        payment_due_date,
        total_estimated_cost,
        total_actual_cost,
        parlor_id,
        clients!inner(
          id,
          name,
          email,
          phone
        )
      `)
      .eq('parlor_id', parlorId)
      .in('payment_status', ['pending', 'partial'])
      .order('service_date', { ascending: true });

    if (error) throw error;

    // Get payments for each case to calculate amounts
    const caseIds = cases?.map(c => c.id) || [];
    const { data: payments } = await supabase
      .from('payments')
      .select('case_id, amount, status')
      .eq('parlor_id', parlorId)
      .in('case_id', caseIds)
      .eq('status', 'completed');

    const alerts: PaymentAlert[] = [];
    
    for (const caseItem of cases || []) {
      const casePayments = payments?.filter(p => p.case_id === caseItem.id) || [];
      const totalPaid = casePayments.reduce((sum, p) => sum + p.amount, 0);
      const totalDue = caseItem.total_estimated_cost || 0;
      const amountDue = totalDue - totalPaid;

      const alert = this.calculateAlertLevel(caseItem, amountDue);
      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  private static calculateAlertLevel(caseItem: CaseWithClient, amountDue: number): PaymentAlert | null {
    if (amountDue <= 0) return null;

    const serviceDate = caseItem.service_date ? new Date(caseItem.service_date) : null;
    const today = new Date();
    
    if (!serviceDate) {
      // No service date - use payment due date or default to 30 days
      const dueDate = caseItem.payment_due_date ? new Date(caseItem.payment_due_date) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 0) {
        return {
          id: '',
          caseId: caseItem.id,
          parlorId: caseItem.parlor_id,
          alertLevel: 'critical',
          message: `OVERDUE: ${caseItem.deceased_name} - Payment of R${amountDue.toFixed(2)} is overdue.`,
          isResolved: false,
          createdAt: new Date()
        };
      }
      
      if (daysUntilDue <= 7) {
        return {
          id: '',
          caseId: caseItem.id,
          parlorId: caseItem.parlor_id,
          alertLevel: 'warning',
          message: `DUE SOON: ${caseItem.deceased_name} - R${amountDue.toFixed(2)} due in ${daysUntilDue} days.`,
          isResolved: false,
          createdAt: new Date()
        };
      }
      
      return null;
    }

    // Service date exists - calculate urgency based on service
    const daysUntilService = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilService <= 0) {
      return {
        id: '',
        caseId: caseItem.id,
        parlorId: caseItem.parlor_id,
        alertLevel: 'critical',
        message: `URGENT: ${caseItem.deceased_name} - R${amountDue.toFixed(2)} unpaid. Service was ${Math.abs(daysUntilService)} days ago.`,
        isResolved: false,
        createdAt: new Date()
      };
    }

    if (daysUntilService <= 2) {
      return {
        id: '',
        caseId: caseItem.id,
        parlorId: caseItem.parlor_id,
        alertLevel: 'critical',
        message: `CRITICAL: ${caseItem.deceased_name} - R${amountDue.toFixed(2)} due in ${daysUntilService} days. Service ${serviceDate.toLocaleDateString()}.`,
        isResolved: false,
        createdAt: new Date()
      };
    }

    if (daysUntilService <= 7) {
      return {
        id: '',
        caseId: caseItem.id,
        parlorId: caseItem.parlor_id,
        alertLevel: 'warning',
        message: `WARNING: ${caseItem.deceased_name} - R${amountDue.toFixed(2)} due in ${daysUntilService} days.`,
        isResolved: false,
        createdAt: new Date()
      };
    }

    return null;
  }

  static async resolveAlert(alertId: string, userId: string): Promise<void> {
    await supabase
      .from('payment_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date(),
        resolved_by: userId
      })
      .eq('id', alertId);
  }

  static async updateCasePaymentStatus(caseId: string, status: string): Promise<void> {
    await supabase
      .from('cases')
      .update({ 
        payment_status: status,
        updated_at: new Date()
      })
      .eq('id', caseId);
  }
}
