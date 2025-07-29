import axios from 'axios'

const url = "/api"

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    message: string;
}

export interface ChangePasswordRequest {
    username: string;
    oldPassword: string;
    newPassword: string;
}

const isAxiosError = (error: unknown): error is { response?: { data?: { error?: string } }; request?: unknown; message?: string } => {
    return typeof error === 'object' && error !== null && ('response' in error || 'request' in error);
}

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
    try {
        const response = await axios.post(`${url}/auth`, data);
        
        if (!response.data || !response.data.user) {
            throw new Error('Invalid response from server');
        }
        
        const tokenPayload = {
            account_id: response.data.user.account_id,
            username: response.data.user.username,
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 
        };
        
        // Use a more robust base64 encoding
        const mockToken = btoa(JSON.stringify(tokenPayload));
        
        return {
            token: mockToken,
            message: "Login successful"
        };
    } catch (err: unknown) {
        console.error("Error logging in:", err);
        
        if (isAxiosError(err)) {
            if (err.response) {
                const errorMessage = err.response.data?.error || 'Login failed';
                throw new Error(errorMessage);
            } else if (err.request) {
                throw new Error('Network error. Please check your connection.');
            }
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Login failed';
        throw new Error(errorMessage);
    }
}

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    try {
        await axios.post(`${url}/auth/change-password`, data);
    } catch (err: unknown) {
        console.error("Error changing password:", err);
        
        if (isAxiosError(err)) {
            if (err.response) {
                const errorMessage = err.response.data?.error || 'Password change failed';
                throw new Error(errorMessage);
            } else if (err.request) {
                throw new Error('Network error. Please check your connection.');
            }
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Password change failed';
        throw new Error(errorMessage);
    }
} 