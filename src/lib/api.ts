import axios from 'axios';
import { type Project } from '@/types';
import { API_CONFIG } from '@/config/constants';

async function fetchProjectsForWallet(walletAddress: string): Promise<Project[]> {
  if (!walletAddress) return [];

  try {
    const projects = await axios(`${API_CONFIG.BACKEND_URL}/projects?walletAddress=${walletAddress}`).then((res) => {
      const projects = res.data.projects && res.data.projects.length > 0 ? res.data.projects : [];
      return projects;
    })

    return projects;
  } catch (error) {
    console.error('Error fetching projects on server:', error);
    return [];
  }
}

const fetchOrCreateUser = async (walletAddress: string) => {
  try {
    const { data } = await axios.post(
      `${API_CONFIG.BACKEND_URL}/user/create`,
      { walletAddress }
    );

    if (!data.success) {
      throw new Error(data.message);
    }
    console.log("[useWallet:fetchOrCreateUser] fetched user data")
    return data.user;
  } catch (error) {
    console.error("[useWallet:fetchOrCreateUser] Error fetching or creating user:", error);
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to fetch or create user');
  }
}

const fetchCodeVersions = async (projectId: string, address: string) => {
  try {
    const response = await axios.get(
      `${API_CONFIG.BACKEND_URL}/projects/${projectId}/versions?walletAddress=${address}`
    );
    if (response.data.versions && Array.isArray(response.data.versions)) {
      return response.data.versions;
    }
  } catch (error) {
    console.log('[Codeview_fetchCodeVersions] Error:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('[Codeview_fetchCodeVersions] No code versions found');
      return;
    } else {
      console.error(
        '[Codeview_fetchCodeVersions] Failed to load code versions:',
        error
      );
    }
  }
};

const fetchProjectData = async (projectId: string, walletAddress: string) => {
  try {
    const res = await axios.get(
      `${API_CONFIG.BACKEND_URL}/projects/${projectId}?walletAddress=${walletAddress}`
    );
    return res.data
  } catch (error) {
    console.error('[Codeview_fetchProjectData] Error:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('[Codeview_fetchProjectData] Project not found');
      return;
    } else {
      console.error(
        '[Codeview_fetchProjectData] Failed to load project data:',
        error
      );
    }
  }
}

export {
  fetchOrCreateUser,
  fetchProjectsForWallet,
  fetchCodeVersions,
  fetchProjectData,
}