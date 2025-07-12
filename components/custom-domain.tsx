'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Globe, Loader2, Check } from 'lucide-react';

import { useWallet } from '@/hooks/useWallet';
import { useGlobalState } from '@/hooks/useGlobalState';
import { useArnsManager } from '@/hooks/useArnsManager';

const FormSchema = z.object({
  selectedArns: z.string().min(1, 'Please select an ARNS domain'),
  undername: z.string().optional(),
});

type FormSchemaType = z.infer<typeof FormSchema>;

export default function CustomDomain({ className }: { className?: string }) {
  const { connected, address } = useWallet();
  const { activeProject } = useGlobalState();

  const {
    arnsRecords,
    isLoading,
    isMigrating,
    currentMapping,
    fetchArnsRecords,
    migrateToArns,
  } = useArnsManager(address, connected, activeProject);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      selectedArns: '',
      undername: '',
    },
  });

  // Load records on connect or address change
  useEffect(() => {
    if (connected && address) {
      fetchArnsRecords();
    }
  }, [connected, address, fetchArnsRecords]);

  const onSubmit = (data: FormSchemaType) => {
    migrateToArns(data.selectedArns, data.undername);
    form.reset();
  };

  if (!connected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            title="Custom Domain"
            aria-label="Custom Domain"
          >
            <Settings size={16} className="text-primary/80" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start">
          <DropdownMenuLabel>Custom Domain</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-4 text-center text-sm text-muted-foreground">
            Connect your wallet to manage ARNS domains
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!activeProject) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            title="Custom Domain"
            aria-label="Custom Domain"
          >
            <Settings size={16} className="text-primary/80" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start">
          <DropdownMenuLabel>Custom Domain</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-4 text-center text-sm text-muted-foreground">
            No active project selected
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          title="Custom Domain"
          aria-label="Custom Domain"
        >
          <Globe size={16} className="text-primary/80" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`w-96 ${className}`} align="start">
        <div className="flex justify-between">
          <DropdownMenuLabel className="flex items-center gap-2">
            Link ARNS Domain
          </DropdownMenuLabel>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchArnsRecords}
            disabled={isLoading}
            className=" h-8"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <div className="px-1.5 py-1 space-y-4">
            {currentMapping && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">
                    Active Mapping
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-600" />
                    <a
                      href={currentMapping.domain}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-green-600 hover:underline"
                    >
                      {currentMapping.domain}
                    </a>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Points to: {currentMapping.url}
                  </div>
                </CardContent>
              </Card>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading domains...</span>
                  </div>
                ) : arnsRecords.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No ARNS domains found. Please register a domain first.
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="selectedArns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select ARNS Domain</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a domain" />
                            </SelectTrigger>
                            <SelectContent>
                              {arnsRecords.map((record) => (
                                <SelectItem
                                  key={record.name}
                                  value={record.name}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{record.name}</span>
                                    {record.isPrimary && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="undername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subdomain (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="@ or yoursubdomain"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isMigrating || isLoading}
                      className="w-full"
                    >
                      {isMigrating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mapping...
                        </>
                      ) : (
                        'Map Domain'
                      )}
                    </Button>
                  </>
                )}
              </form>
            </Form>
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
