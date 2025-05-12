import axios from 'axios';
import { RequestAccess, RequestAccessForm, RequestAccessResponse } from '@/types/types';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Submit a request for access to the platform
 */
export const submitAccessRequest = async (
    formData: RequestAccessForm
): Promise<RequestAccessResponse> => {
    try {
        const response = await axios.post(
            `${API_URL}/request-access/submit`,
            formData
        );
        return response.data;
    } catch (error) {
        console.error('Error submitting access request:', error);
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data as RequestAccessResponse;
        }
        return {
            success: false,
            message: 'Failed to submit access request. Please try again later.',
        };
    }
};

/**
 * Get all access requests for a user
 */
export const getUserAccessRequests = async (
    walletAddress: string
): Promise<{ success: boolean; requests?: RequestAccess[]; message?: string }> => {
    try {
        const response = await axios.get(
            `${API_URL}/request-access/user/${walletAddress}`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching user access requests:', error);
        
        // If it's a 404, it means the user has no requests yet (which is normal for new users)
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.log('No access requests found for user (404)');
            return {
                success: true,
                requests: [],
                message: 'No access requests found for this wallet',
            };
        }
        
        // For other errors, return the error response or a generic error
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        return {
            success: false,
            message: 'Failed to fetch access requests. Please try again later.',
        };
    }
}; 