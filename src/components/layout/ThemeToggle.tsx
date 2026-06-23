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

  return (
    <div className="flex items-center border">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const active = mounted && (theme || "system") === mode.value;

        return (
          <Tooltip key={mode.value}>
            <TooltipTrigger asChild>
              <Button
                aria-label={mode.label}
                aria-pressed={active}
                className={`size-8 rounded-none border-r last:border-r-0 ${
                  active ? "bg-accent text-accent-foreground" : ""
                }`}
                size="icon"
                variant="ghost"
                onClick={() => setTheme(mode.value)}
              >
                <Icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{mode.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
