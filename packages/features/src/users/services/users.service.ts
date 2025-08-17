import type { UserDTO, ApiResponse } from '@repo/shared';
import type { PaginatedResponse } from '@repo/shared';
import { tokenService } from '../../auth/services/token.service';

interface UsersFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
}

interface UpdateUserData extends Partial<CreateUserData> {
  isActive?: boolean;
}

class UsersService {
  private baseURL: string;
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 
                   process.env.EXPO_PUBLIC_API_URL || 
                   '/api/v1';
  }

  async getUsers(filters: UsersFilters = {}): Promise<{ items: UserDTO[]; total: number }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${this.baseURL}/users?${params.toString()}`, {
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data: PaginatedResponse<UserDTO> = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch users');
    }

    return {
      items: data.data,
      total: data.pagination.total
    };
  }

  async getUserById(id: string): Promise<UserDTO> {
    const response = await fetch(`${this.baseURL}/users/${id}`, {
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    const data: ApiResponse<{ user: UserDTO }> = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch user');
    }

    return data.data.user;
  }

  async createUser(userData: CreateUserData): Promise<UserDTO> {
    const response = await fetch(`${this.baseURL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this.getAuthHeaders()),
      },
      body: JSON.stringify(userData),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    const data: ApiResponse<{ user: UserDTO }> = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create user');
    }

    return data.data.user;
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<UserDTO> {
    const response = await fetch(`${this.baseURL}/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(await this.getAuthHeaders()),
      },
      body: JSON.stringify(userData),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    const data: ApiResponse<{ user: UserDTO }> = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update user');
    }

    return data.data.user;
  }

  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/users/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }

    const data: ApiResponse<void> = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete user');
    }
  }

  async inviteUser(email: string, role: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this.getAuthHeaders()),
      },
      body: JSON.stringify({ email, role }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to send invitation');
    }

    const data: ApiResponse<void> = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to send invitation');
    }
  }

  async resendInvitation(invitationId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/invitations/${invitationId}/resend`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to resend invitation');
    }

    const data: ApiResponse<void> = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to resend invitation');
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await tokenService.getAccessToken();
    const headers: Record<string, string> = {
      'X-Client-Type': this.getClientType(),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private getClientType(): string {
    return typeof window !== 'undefined' && !('expo' in window)
      ? 'web'
      : 'mobile';
  }
}

export const usersService = new UsersService();