"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { PhoneOff, Loader2 } from "lucide-react";

interface MobileContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

interface MobileProviderProps {
  children: React.ReactNode;
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
}

// Mobile restriction component
function MobileRouteGuard({ children }: { children: React.ReactNode }) {
  const { isMobile } = useMobile();
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isMobile && pathname !== "/") {
      setIsRedirecting(true);
      // Small delay to prevent flash, then redirect
      const timer = setTimeout(() => {
        navigate("/");
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isMobile, pathname, navigate]);

  // Show loading during redirect
  if (isMobile && pathname !== "/" && isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // Show restriction message for mobile users on non-home routes
  if (isMobile && pathname !== "/") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
        <PhoneOff className="w-16 h-16 mb-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-3">Mobile Access Restricted</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          This application is optimized for desktop use. Please access it from a
          desktop browser for the full experience.
        </p>
        <Button onClick={() => navigate("/")} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }

  // Render children for all other cases
  return <>{children}</>;
}

function MobileProvider({
  children,
  mobileBreakpoint = 768,
  tabletBreakpoint = 1024,
}: MobileProviderProps) {
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set initial value on mount to prevent hydration mismatch
    setIsClient(true);
    setScreenWidth(window.innerWidth);

    // Handler for window resize events
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up event listener
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isMobile = isClient && screenWidth < mobileBreakpoint;
  const isTablet =
    isClient &&
    screenWidth >= mobileBreakpoint &&
    screenWidth < tabletBreakpoint;
  const isDesktop = isClient && screenWidth >= tabletBreakpoint;

  const value = {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth: isClient ? screenWidth : 0,
  };

  return (
    <MobileContext.Provider value={value}>
      <MobileRouteGuard>{children}</MobileRouteGuard>
    </MobileContext.Provider>
  );
}

function useMobile() {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error("useMobile must be used within a MobileProvider");
  }
  return context;
}

// Keep the old hooks for backward compatibility
function useIsMobile(mobileBreakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Set initial value on mount
    setIsMobile(window.innerWidth < mobileBreakpoint);

    // Handler for window resize events
    const handleResize = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up event listener
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileBreakpoint]);

  return isMobile;
}

import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

const notifyNoWallet = () => {
  toast.error("No wallet detected", {
    description: "Please install the Wander app to continue",
    action: {
      label: "Install",
      onClick: () => {
        window.open(
          "https://www.wander.app/download?tab=download-browser",
          "_blank"
        );
      },
    },
  });
};

export {
  MobileRouteGuard,
  MobileProvider as default,
  useMobile,
  useIsMobile,
  notifyNoWallet,
};
