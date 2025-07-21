import { toast } from 'sonner';
import { type SandpackPreviewRef } from '@codesandbox/sandpack-react';

/**
 * This is a compatibility type to work with the Sandpack preview ref
 */
export type SandpackClientInterface = SandpackPreviewRef;

/**
 * Result interface for CodeSandbox URL
 */
export interface CodeSandboxResult {
  sandboxId: string;
  editorUrl: string;
}

/**
 * Safely gets the SandPack client with error handling
 * @param previewRef - Reference to the SandPack preview component
 * @returns The client and clientId if successful, otherwise null
 */
export const getSandpackClient = async (
  previewRef: React.RefObject<SandpackPreviewRef | null>
) => {
  try {
    console.log('Initializing SandPack client...');

    if (!previewRef.current) {
      console.warn('SandPack preview reference is not available yet');
      return null;
    }

    const client = previewRef.current.getClient();
    const clientId = previewRef.current.clientId;

    if (!client || !clientId) {
      console.warn('SandPack client or clientId not available');
      return null;
    }

    console.log('SandPack client obtained successfully', client);
    console.log('Client ID:', clientId);

    return { client, clientId };
  } catch (error) {
    console.error('Error getting SandPack client:', error);
    toast.error(
      'Failed to initialize preview: ' +
        (error instanceof Error ? error.message : 'Unknown error')
    );
    return null;
  }
};

/**
 * Gets the CodeSandbox URL from the SandPack client
 * @param client - The SandPack client
 * @returns The CodeSandbox result or null if failed
 */
export const getCodeSandboxURL = async (
  client: unknown
): Promise<CodeSandboxResult | null> => {
  try {
    console.log('Getting CodeSandbox URL...');
    // We need to use type assertion here as the SandPack client's type is not exported
    const result = await (
      client as { getCodeSandboxURL: () => Promise<CodeSandboxResult> }
    ).getCodeSandboxURL();
    console.log('CodeSandbox URL result:', result);
    return result;
  } catch (error) {
    console.error('Error getting CodeSandbox URL:', error);
    toast.error(
      'Failed to get CodeSandbox URL: ' +
        (error instanceof Error ? error.message : 'Unknown error')
    );
    return null;
  }
};

/**
 * Copies the deployment link to clipboard
 * @param sandboxId - The sandbox ID
 */
export const copyDeploymentLink = (sandboxId: string): void => {
  const deploymentUrl = `https://${sandboxId}.csb.app/`;

  navigator.clipboard
    .writeText(deploymentUrl)
    .then(() => {
      toast.success('Deployment Link Copied to the clipboard');
    })
    .catch((err) => {
      console.error('Failed to copy to clipboard:', err);
      toast.error('Failed to copy deployment link');
    });
};
