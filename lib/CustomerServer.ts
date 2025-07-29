export interface Customer {
  customer_id: string | number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  contact: string;
  address: string;
  birthdate: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  contact: string;
  address: string;
  birthdate: string;
  email: string;
}

export interface CustomerUpdateData extends CustomerFormData {
  customer_id: string | number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

class CustomerServer {
  private baseUrl = '/api/customers';

  // Get all customers
  async getAllCustomers(): Promise<Customer[]> {
    try {
      const response = await fetch(this.baseUrl);
      const result: ApiResponse<Customer[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch customers');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching customers');
    }
  }

  // Get a single customer by ID
  async getCustomerById(customer_id: string | number): Promise<Customer> {
    try {
      const response = await fetch(`${this.baseUrl}/${customer_id}`);
      const result: ApiResponse<Customer> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch customer');
      }

      if (!result.data) {
        throw new Error('Customer not found');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching customer');
    }
  }

  // Create a new customer
  async createCustomer(customerData: CustomerFormData): Promise<Customer> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      const result: ApiResponse<Customer> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create customer');
      }

      if (!result.data) {
        throw new Error('Failed to create customer');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while creating customer');
    }
  }

  // Update an existing customer
  async updateCustomer(updateData: CustomerUpdateData): Promise<Customer> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result: ApiResponse<Customer> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update customer');
      }

      if (!result.data) {
        throw new Error('Failed to update customer');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while updating customer');
    }
  }

  // Delete a customer
  async deleteCustomer(customer_id: string | number): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_id }),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete customer');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while deleting customer');
    }
  }

  // Update customer status
  async updateCustomerStatus(customer_id: string | number, status: string): Promise<Customer> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_id, status }),
      });

      const result: ApiResponse<Customer> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update customer status');
      }

      if (!result.data) {
        throw new Error('Failed to update customer status');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while updating customer status');
    }
  }

  // Search customers
  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
      const result: ApiResponse<Customer[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to search customers');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while searching customers');
    }
  }

  // Get customers by status
  async getCustomersByStatus(status: string): Promise<Customer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${status}`);
      const result: ApiResponse<Customer[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch customers by status');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching customers by status');
    }
  }
}

// Export a singleton instance
export const customerServer = new CustomerServer();