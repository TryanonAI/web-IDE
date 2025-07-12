import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export type ArnsRecord = {
  name: string;
  processId: string;
  startTimestamp: number;
  endTimestamp?: number;
  type: 'lease' | 'permabuy';
  isPrimary: boolean;
};

export function useArnsManager(
  address: string | null,
  connected: boolean,
  activeProject: { deploymentUrl?: string; projectId: string; title: string } | null
) {
  const [arnsRecords, setArnsRecords] = useState<ArnsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [currentMapping, setCurrentMapping] = useState<{ domain: string; url: string } | null>(null);

  const fetchArnsRecords = useCallback(async () => {
    if (typeof window === 'undefined' || !connected || !address) return;

    setIsLoading(true);
    try {
      const { ANTRegistry, ARIO } = await import('@ar.io/sdk/web');
      const antRegistry = ANTRegistry.init();
      const ario = ARIO.mainnet();

      const acl = await antRegistry.accessControlList({ address });
      const allProcessIds = { ...acl.Owned, ...acl.Controlled };

      if (Object.keys(allProcessIds).length === 0) {
        setArnsRecords([]);
        return;
      }

      const arnsResponse = await ario.getArNSRecords({ filters: { processId: allProcessIds } });

      let primaryName: string | null = null;
      try {
        const primary = await ario.getPrimaryName({ address });
        primaryName = primary?.name || null;
      } catch {
        // No primary name found is okay
      }

      const recordsWithPrimaryFlag = arnsResponse.items.map((rec) => ({
        ...rec,
        isPrimary: rec.name === primaryName,
      }));

      setArnsRecords(recordsWithPrimaryFlag);
    } catch (error) {
      console.error('Error fetching ARNS records:', error);
      toast.error('Failed to fetch your ARNS domains');
    } finally {
      setIsLoading(false);
    }
  }, [address, connected]);

  const migrateToArns = useCallback(
    async (selectedName: string, undername?: string) => {
      if (!activeProject?.deploymentUrl || !connected) {
        toast.error('No active project or deployment URL found');
        return;
      }

      const selectedRecord = arnsRecords.find((r) => r.name === selectedName);
      if (!selectedRecord) {
        toast.error('Selected ARNS domain not found');
        return;
      }

      setIsMigrating(true);
      try {
        const { ANT, ArconnectSigner } = await import('@ar.io/sdk/web');

        if (!window.arweaveWallet) {
          throw new Error('ArConnect wallet not found');
        }

        const ant = ANT.init({
          processId: selectedRecord.processId,
          signer: new ArconnectSigner(window.arweaveWallet),
        });

        const txIdMatch = activeProject.deploymentUrl.match(/\/([a-zA-Z0-9_-]+)$/);
        if (!txIdMatch) throw new Error('Invalid deployment URL format');

        const transactionId = txIdMatch[1];
        const cleanUndername = undername?.trim() || '@';

        let result;
        if (cleanUndername === '@') {
          result = await ant.setBaseNameRecord(
            { transactionId, ttlSeconds: 300 },
            {
              tags: [
                { name: 'App-Name', value: 'Anon' },
                { name: 'Project-Id', value: activeProject.projectId },
                { name: 'Project-Name', value: activeProject.title },
                { name: 'Timestamp', value: new Date().toISOString() },
              ],
            }
          );
        } else {
          result = await ant.setUndernameRecord(
            { undername: cleanUndername, transactionId, ttlSeconds: 300 },
            {
              tags: [
                { name: 'App-Name', value: 'Anon' },
                { name: 'Project-Id', value: activeProject.projectId },
                { name: 'Project-Name', value: activeProject.title },
                { name: 'Timestamp', value: new Date().toISOString() },
              ],
            }
          );
        }

        const finalUrl =
          cleanUndername === '@'
            ? `https://${selectedRecord.name}.ar.io`
            : `https://${cleanUndername}_${selectedRecord.name}.ar.io`;

        setCurrentMapping({ domain: finalUrl, url: activeProject.deploymentUrl });

        toast.success(
          `Successfully mapped ${activeProject.title} to ${finalUrl}${
            result?.id ? ` (TX: ${result.id.slice(0, 8)}...)` : ''
          }`,
          { duration: 5000 }
        );
      } catch (error) {
        console.error('Migration error:', error);
        const message = error instanceof Error ? error.message : 'Migration failed';
        toast.error(`Failed to map domain: ${message}`);
      } finally {
        setIsMigrating(false);
      }
    },
    [arnsRecords, activeProject, connected]
  );

  return {
    arnsRecords,
    isLoading,
    isMigrating,
    currentMapping,
    fetchArnsRecords,
    migrateToArns,
  };
}
