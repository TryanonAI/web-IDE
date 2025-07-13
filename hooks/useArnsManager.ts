import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ANT, ArconnectSigner } from '@ar.io/sdk';

export type ArnsRecord = {
  name: string;
  processId: string;
  startTimestamp: number;
  endTimestamp?: number;
  type: 'lease' | 'permabuy';
  // isPrimary: boolean;
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

  /*
  const fetchArnsRecords1 = useCallback(async () => {
    if (typeof window === 'undefined' || !connected || !address) return;
    const { ANTRegistry, ARIO } = await import('@ar.io/sdk/web');

    setIsLoading(true);
    try {
      const antRegistry = ANTRegistry.init();
      const ario = ARIO.mainnet();

      const acl = await antRegistry.accessControlList({ address });
      const allProcessIds = { ...acl.Owned };

      if (Object.keys(allProcessIds).length === 0) {
        setArnsRecords([]);
        return;
      }
      const arnsResponse = await ario.getArNSRecords({ filters: { processId: allProcessIds } }).then((records) => records.items.map((record) => ({
        name: record.name,
        processId: record.processId,
      })));

      // func to get primary name
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

      setArnsRecords(arnsResponse);
    } catch (error) {
      console.error('Error fetching ARNS records:', error);
      toast.error('Failed to fetch your ARNS domains');
    } finally {
      setIsLoading(false);
    }
  }, [address, connected]);
  */

  async function fetchArnsRecords() {
    setIsLoading(true);

    try {
      // Use the same API endpoints as in the other project
      const registryUrl = 'https://cu.ardrive.io/dry-run?process-id=i_le_yKKPVstLTDSmkHRqf-wYphMnwB9OhleiTgMkWc'
      const namesUrl = 'https://cu.ardrive.io/dry-run?process-id=qNvAoz0TgcH7DMg8BCVn8jF32QH5L6T29VjHxhHqqGE'

      const headers = {
        'accept': '*/*',
        'content-type': 'application/json',
        'origin': 'https://arns.app',
        'referer': 'https://arns.app/'
      }

      // First API call to get owned process IDs
      const registryBody = JSON.stringify({
        Id: "1234",
        Target: "i_le_yKKPVstLTDSmkHRqf-wYphMnwB9OhleiTgMkWc",
        Owner: "1234",
        Anchor: "0",
        Data: "1234",
        Tags: [
          { name: "Action", value: "Access-Control-List" },
          { name: "Address", value: address },
          { name: "Data-Protocol", value: "ao" },
          { name: "Type", value: "Message" },
          { name: "Variant", value: "ao.TN.1" }
        ]
      })

      const registryResponse = await fetch(registryUrl, { method: 'POST', headers, body: registryBody })
      if (!registryResponse.ok) throw new Error(`Registry API error: ${registryResponse.status}`)

      const registryData = JSON.parse(await registryResponse.text())

      let ownedProcessIds: string[] = []
      if (registryData.Messages?.[0]?.Data) {
        const ownedData = JSON.parse(registryData.Messages[0].Data)
        ownedProcessIds = ownedData.Owned || []
      }

      // If no owned process IDs, return empty array
      if (ownedProcessIds.length === 0) return []

      // Second API call to get names for owned process IDs (with pagination)
      let cursor = ""
      const processIdToItem = new Map<string, unknown>()
      let keepPaging = true

      while (keepPaging) {
        const tags = [
          { name: "Action", value: "Paginated-Records" },
          { name: "Limit", value: "1000" },
          { name: "Data-Protocol", value: "ao" },
          { name: "Type", value: "Message" },
          { name: "Variant", value: "ao.TN.1" }
        ]

        if (cursor) tags.push({ name: "Cursor", value: cursor })

        const namesBody = JSON.stringify({
          Id: "1234",
          Target: "qNvAoz0TgcH7DMg8BCVn8jF32QH5L6T29VjHxhHqqGE",
          Owner: "1234",
          Anchor: "0",
          Data: "1234",
          Tags: tags
        })

        const namesResponse = await fetch(namesUrl, { method: 'POST', headers, body: namesBody })
        if (!namesResponse.ok) throw new Error(`Names API error: ${namesResponse.status}`)

        const namesText = await namesResponse.text()
        const namesData = JSON.parse(namesText)

        if (namesData.Messages?.[0]?.Data) {
          const parsedData = JSON.parse(namesData.Messages[0].Data)
          const items = parsedData.items || []

          // Check if any item matches our process IDs
          for (const item of items) {
            if (ownedProcessIds.includes(item.processId)) {
              processIdToItem.set(item.processId, item)
            }
          }

          if (parsedData.nextCursor) {
            cursor = parsedData.nextCursor
          } else {
            keepPaging = false
          }
        } else {
          keepPaging = false
        }
      }

      // Return the matches we found
      const arnsResponse = ownedProcessIds.map(processId => {
        const item = processIdToItem.get(processId)
        if (item) {
          return {
            // @ts-expect-error uignore
            name: item.name,
            // @ts-expect-error uignore
            processId: item.processId,
            undername: '@' // Default undername
          }
        } else {
          return {
            name: processId, // Fallback to processId if name not found
            processId,
            undername: '@'
          }
        }
      }).filter(item => item.name !== item.processId) // Filter out items where name equals processId
      
      // @ts-expect-error uignore
      setArnsRecords(arnsResponse);

      console.log('Found ARNS names:', arnsResponse)
      return arnsResponse

    } catch (error) {
      console.error('Error fetching ARNS names:', error)
      throw new Error('Failed to fetch ARNS names. Please try again.')
    } finally {
      setIsLoading(false);
    }
  }
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
        if (typeof window === 'undefined' || !window.arweaveWallet) {
          throw new Error('ArConnect wallet not found');
        }
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
          `Successfully mapped ${activeProject.title} to ${finalUrl}${result?.id ? ` (TX: ${result.id.slice(0, 8)}...)` : ''
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
