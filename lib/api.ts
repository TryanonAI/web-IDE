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
//     walletAddress: string
// ): Promise<{ success: boolean; requests?: RequestAccess[]; message?: string }> => {
//     try {
//         const response = await axios.get(
//             `${API_URL}/user/${walletAddress}`
//         );
//         if (response.data.success && response.data.user) {
//             // Return an empty requests array since we're phasing out RequestAccess
//             return {
//                 success: true,
//                 requests: [],
//                 trialStatus: response.data.user.trialStatus
//             };
//         }
//         return {
//             success: false,
//             requests: [],
//             message: 'Could not retrieve user information'
//         };
//     } catch (error) {
//         console.error('Error fetching user access status:', error);

//         if (axios.isAxiosError(error) && error.response?.status === 404) {
//             console.log('User not found (404)');
//             return {
//                 success: false,
//                 requests: [],
//                 message: 'User not found'
//             };
//         }

//         if (axios.isAxiosError(error) && error.response) {
//             return error.response.data;
//         }
//         return {
//             success: false,
//             requests: [],
//             message: 'Failed to fetch access status. Please try again later.',
//         };
//     }
// }; 