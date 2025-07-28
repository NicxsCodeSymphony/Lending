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

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
    try {
        const response = await axios.post(`${url}/auth`, data);
        // Create a mock token for compatibility with existing code
        const mockToken = btoa(JSON.stringify({
            account_id: response.data.user.account_id,
            username: response.data.user.username,
            exp: Date.now() / 1000 + 24 * 60 * 60 // 24 hours from now
        }));
        
        return {
            token: mockToken,
            message: "Login successful"
        };
    } catch (err) {
        console.error("Error logging in:", err);
        throw err;
    }
}

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    try {
        await axios.post(`${url}/auth/change-password`, data);
    } catch (err) {
        console.error("Error changing password:", err);
        throw err;
    }
} 