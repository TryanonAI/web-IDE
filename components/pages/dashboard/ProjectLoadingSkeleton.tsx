import { Skeleton } from "@/components/ui/skeleton";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default function ProjectLoadingSkeleton() {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      {/* Chat Panel Skeleton */}
      <ResizablePanel defaultSize={43} minSize={43}>
        <div className="flex flex-col h-full bg-background border-r-1">
          <div className="flex items-center justify-between p-4 border-b">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          
          <div className="flex-1 p-4 space-y-4 overflow-hidden">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <div className="flex-1 space-y-2 text-right">
                <Skeleton className="h-4 w-2/3 ml-auto" />
                <Skeleton className="h-4 w-1/3 ml-auto" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            </div>
            
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            </div>
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </div>
      </ResizablePanel>
      
      {/* Code Panel Skeleton */}
      <ResizablePanel defaultSize={57} minSize={57}>
        <div className="flex flex-col h-full bg-background">
          {/* Code Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          
          {/* File Tabs */}
          <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-24" />
          </div>
          
          {/* Code Area */}
          <div className="flex-1 p-4 space-y-3">
            {/* Code Lines */}
            {Array.from({ length: 15 }, (_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-4 w-6 flex-shrink-0" />
                <Skeleton 
                  className="h-4" 
                  style={{ width: `${Math.random() * 60 + 20}%` }}
                />
              </div>
            ))}
          </div>
          
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3 border-t bg-muted/30">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
} 