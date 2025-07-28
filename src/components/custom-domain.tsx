import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Globe, Check, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { useGlobalState, useWallet } from "../hooks";
import { useArnsManager } from "../hooks/useArnsManager";
import { Button } from "@/components/ui/button";

const FormSchema = z.object({
  selectedArns: z.string().min(1, "Please select an ARNS domain"),
  undername: z.string().optional(),
});

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

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      selectedArns: "",
      undername: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    await migrateToArns(data.selectedArns, data.undername);
  };

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
          ARNS
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
            onClick={async () => {
              if (isLoading) return;
              await fetchArnsRecords();
            }}
            disabled={isLoading}
            className=" h-8"
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3 w-3" />
            )}
          </Button>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <div className="px-1.5 py-1 space-y-4">
            {currentMapping && (
              <Card className="p-2">
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
                    {currentMapping.url}
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
                    <span className="ml-2 text-sm animate-pulse">
                      Fetching domains...
                    </span>
                  </div>
                ) : arnsRecords.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No ARNS domains found.
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="selectedArns"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Choose domain" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {arnsRecords.map((record) => (
                                <SelectItem
                                  key={record.name}
                                  value={record.name}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{record.name}</span>
                                    {/* {record.isPrimary && (
                                      <Badge
                                        variant="secondary"
                                        className="ml-2 text-xs"
                                      >
                                        Primary
                                      </Badge>
                                    )} */}
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
                          <FormLabel className="text-xs">
                            Subdomain (optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="eg. xyz_domain.ar.io"
                              className="h-8"
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            {field.value
                              ? `Will create: ${field.value}_${
                                  form.watch("selectedArns") || "domain"
                                }.ar.io`
                              : `default: ${
                                  form.watch("selectedArns") || "domain"
                                }.ar.io`}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-8"
                      disabled={isMigrating || !activeProject.deploymentUrl}
                    >
                      {isMigrating ? "Publishing..." : "Publish Domain"}
                    </Button>

                    {!activeProject.deploymentUrl && (
                      <div className="text-xs text-destructive text-center">
                        Project must be deployed before mapping a domain
                      </div>
                    )}
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
