import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { applyAccentColorFromStorage } from "@/lib/accentColor";

type AccentColor = {
  name: string;
  value: string;
  hsl: string;
};

const accentColors: AccentColor[] = [
  { name: "Purple", value: "purple", hsl: "280 75% 60%" },
  { name: "Blue", value: "blue", hsl: "210 90% 55%" },
  { name: "Teal", value: "teal", hsl: "170 70% 50%" },
  { name: "Green", value: "green", hsl: "150 70% 45%" },
  { name: "Orange", value: "orange", hsl: "30 95% 60%" },
  { name: "Pink", value: "pink", hsl: "340 75% 55%" },
  { name: "Red", value: "red", hsl: "0 85% 58%" },
  { name: "Indigo", value: "indigo", hsl: "250 75% 60%" },
];

export default function AccentColorSelector() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("purple");

  const applyAccentColor = (colorValue: string) => {
    const color = accentColors.find((c) => c.value === colorValue);
    if (color && typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--accent", color.hsl);
      root.style.setProperty("--ring", color.hsl);
      root.style.setProperty("--primary", color.hsl);
      // Update sidebar colors
      root.style.setProperty("--sidebar-background", color.hsl);
      root.style.setProperty("--sidebar-primary", color.hsl);
      root.style.setProperty("--sidebar-ring", color.hsl);
      localStorage.setItem("accent-color", colorValue);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Load saved accent color from localStorage
    const saved = localStorage.getItem("accent-color");
    if (saved) {
      setSelectedColor(saved);
      applyAccentColor(saved);
    }
  }, []);

  // Re-apply accent color when theme changes
  useEffect(() => {
    if (mounted) {
      const saved = localStorage.getItem("accent-color");
      if (saved) {
        applyAccentColor(saved);
      }
    }
  }, [theme, mounted]);

  const handleColorSelect = (colorValue: string) => {
    setSelectedColor(colorValue);
    applyAccentColor(colorValue);
  };

  if (!mounted) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {accentColors.map((color) => (
          <Card key={color.value} className="h-20">
            <CardContent className="p-3">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-border"
                  style={{ backgroundColor: `hsl(${color.hsl})` }}
                />
                <span className="text-xs font-medium">{color.name}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {accentColors.map((color) => {
        const isSelected = selectedColor === color.value;
        return (
          <Card
            key={color.value}
            className={cn(
              "cursor-pointer transition-all hover:border-primary h-20",
              isSelected && "border-primary border-2"
            )}
            onClick={() => handleColorSelect(color.value)}
          >
            <CardContent className="p-3 flex flex-col items-center justify-center gap-2 h-full">
              <div
                className="w-8 h-8 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: `hsl(${color.hsl})`,
                  borderColor: isSelected ? `hsl(${color.hsl})` : "hsl(var(--border))",
                }}
              />
              <span className="text-xs font-medium">{color.name}</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

