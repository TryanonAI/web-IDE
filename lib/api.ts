import axios from 'axios';
import { RequestAccessForm, RequestAccessResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const submitAccessRequest = async (
    formData: RequestAccessForm
): Promise<RequestAccessResponse> => {
    try {
        const response = await axios.post(
            `${API_URL}/user/request-trial`,
            formData
        );

        return {
            success: response.data.success,
            message: response.data.message,
            user: response.data.user
        };
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