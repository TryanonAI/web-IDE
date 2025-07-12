'use client';

import { useWallet } from '@/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Wallet, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { connected, address, shortAddress, user, disconnect } = useWallet();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const openArweaveExplorer = () => {
    if (address) {
      window.open(`https://arweave.app/address/${address}`, '_blank');
    }
  };

  if (!connected) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="h-full p-8">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <User size={64} className="text-muted-foreground/30 mb-6" />
            <h1 className="text-2xl font-semibold mb-3">Connect Your Wallet</h1>
            <p className="text-muted-foreground max-w-md">
              Connect your Arweave wallet to view your profile information and
              manage your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="h-full p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Profile</h1>
              <p className="text-muted-foreground">
                Manage your account and wallet information
              </p>
            </div>
          </div>

          {/* Wallet Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet size={20} />
                Wallet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{shortAddress}</div>
                    <div className="text-sm text-muted-foreground">
                      Arweave Address
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyAddress}>
                    <Copy size={14} className="mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openArweaveExplorer}
                  >
                    <ExternalLink size={14} className="mr-1" />
                    Explorer
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant="default" className="mt-1">
                    Connected
                  </Badge>
                </div>
                {user && (
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Projects
                    </div>
                    <div className="text-lg font-medium mt-1">
                      {user.projects?.length || 0}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Disconnect Wallet</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    This will disconnect your wallet and clear all local data.
                  </p>
                  <Button variant="destructive" onClick={disconnect}>
                    Disconnect Wallet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
