import React from "react";
import { Framework } from "@/types";
import { Code2, Palette } from "lucide-react";

export interface FrameworkOption {
  value: Framework;
  label: string;
  icon: React.ReactNode;
}

export const frameworks: FrameworkOption[] = [
  {
    value: Framework.React,
    label: "Dev (React)",
    icon: <Code2 className="h-4 w-4" />,
  },
  {
    value: Framework.Html,
    label: "No-Code (HTML)",
    icon: <Palette className="h-4 w-4" />,
  },
];
