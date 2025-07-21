import CheckConnection from "../common/CheckConnection";
import MobileProvider from "@/hooks/use-mobile";
import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { Outlet } from "react-router";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "sonner";

const RootLayout: React.FC = () => {
  return (
    <>
      <MobileProvider>
        <CheckConnection>
          <Outlet />
          <Toaster />
        </CheckConnection>
      </MobileProvider>
      <Analytics />
      <SpeedInsights />
    </>
  );
};

export default RootLayout;
