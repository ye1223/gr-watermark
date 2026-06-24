"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const modes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentMode = modes.find((mode) => mode.value === (mounted ? theme : "system")) || modes[2];
  const currentIndex = modes.findIndex((mode) => mode.value === currentMode.value);
  const nextMode = modes[(currentIndex + 1) % modes.length];
  const Icon = currentMode.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={`${currentMode.label}. Switch to ${nextMode.label}`}
          className="size-8 rounded-lg border bg-muted text-muted-foreground hover:bg-background hover:text-foreground"
          size="icon"
          variant="ghost"
          onClick={() => setTheme(nextMode.value)}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{currentMode.label}</TooltipContent>
    </Tooltip>
  );
}
