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
    <div className="flex items-center rounded-lg border bg-muted p-0.5">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const active = mounted && (theme || "system") === mode.value;

        return (
          <Tooltip key={mode.value}>
            <TooltipTrigger asChild>
              <Button
                aria-label={mode.label}
                aria-pressed={active}
                className={`size-7 rounded-md ${
                  active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
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
