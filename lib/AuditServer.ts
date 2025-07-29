export interface AuditRecord {
  audit_id: number;
  actor_id: number;
  actor_role: string;
  action_type: string;
  entity_id: number;
  entity_type: string;
  action_details: string;
  time: string;
}

export interface CreateAuditData {
  actor_id: number;
  actor_role: string;
  action_type: string;
  entity_id: number;
  entity_type: string;
  action_details: string;
}

export interface UpdateAuditData {
  audit_id: number;
  actor_id?: number;
  actor_role?: string;
  action_type?: string;
  entity_id?: number;
  entity_type?: string;
  action_details?: string;
}

class AuditServer {
  private baseUrl = '/api/audit';

  async getAllAuditRecords(): Promise<AuditRecord[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch audit records');
      }

      return await response.json();
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to fetch audit records: ${err.message}`);
      }
      throw new Error('Failed to fetch audit records');
    }
  }

  async createAuditRecord(data: CreateAuditData): Promise<AuditRecord> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create audit record');
      }

      return await response.json();
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to create audit record: ${err.message}`);
      }
      throw new Error('Failed to create audit record');
    }
  }

  async updateAuditRecord(data: UpdateAuditData): Promise<AuditRecord> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update audit record');
      }

      return await response.json();
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to update audit record: ${err.message}`);
      }
      throw new Error('Failed to update audit record');
    }
  }

  async deleteAuditRecord(audit_id: number): Promise<{ message: string; data: unknown }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audit_id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete audit record');
      }

      return await response.json();
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to delete audit record: ${err.message}`);
      }
      throw new Error('Failed to delete audit record');
    }
  }

  // Helper method to log common actions
  async logAction(
    actor_id: number,
    actor_role: string,
    action_type: string,
    entity_id: number,
    entity_type: string,
    action_details: string,
  ): Promise<AuditRecord> {
    return this.createAuditRecord({
      actor_id,
      actor_role,
      action_type,
      entity_id,
      entity_type,
      action_details,
    });
  }

  // Helper method to log customer actions
  async logCustomerAction(
    actor_id: number,
    actor_role: string,
    action_type: 'create' | 'update' | 'delete' | 'view',
    customer_id: number,
    action_details: string,
  ): Promise<AuditRecord> {
    return this.logAction(
      actor_id,
      actor_role,
      action_type,
      customer_id,
      'customer',
      action_details,
    );
  }

  // Helper method to log loan actions
  async logLoanAction(
    actor_id: number,
    actor_role: string,
    action_type: 'create' | 'update' | 'delete' | 'payment' | 'view',
    loan_id: number,
    action_details: string,
  ): Promise<AuditRecord> {
    return this.logAction(
      actor_id,
      actor_role,
      action_type,
      loan_id,
      'loan',
      action_details,
    );
  }

  // Helper method to log payment actions
  async logPaymentAction(
    actor_id: number,
    actor_role: string,
    action_type: 'create' | 'update' | 'delete' | 'view',
    payment_id: number,
    action_details: string,
  ): Promise<AuditRecord> {
    return this.logAction(
      actor_id,
      actor_role,
      action_type,
      payment_id,
      'payment',
      action_details,
    );
  }
}

export const auditServer = new AuditServer(); 