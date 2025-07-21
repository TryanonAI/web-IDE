import React from "react";
import { useRouteError, Link } from "react-router";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteError {
  statusText?: string;
  message?: string;
  status?: number;
}

const ErrorPage: React.FC = () => {
  const error = useRouteError() as RouteError;
  
  const isNotFound = error?.status === 404;
  
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a1a1a] text-white">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-8">
          <AlertTriangle className="h-16 w-16 text-[#00FFD1] mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">
            {isNotFound ? "404" : "Oops!"}
          </h1>
          <h2 className="text-xl text-white/80 mb-4">
            {isNotFound ? "Page Not Found" : "Something went wrong"}
          </h2>
          <p className="text-white/60 mb-8">
            {isNotFound 
              ? "The page you're looking for doesn't exist or has been moved."
              : error?.statusText || error?.message || "An unexpected error occurred."
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
          
          {!isNotFound && (
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;