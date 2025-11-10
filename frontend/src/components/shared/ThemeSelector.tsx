import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

const themes: { value: Theme; label: string; description: string; icon: typeof Sun }[] = [
  {
    value: "light",
    label: "Light",
    description: "Clean and bright interface",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Easy on the eyes",
    icon: Moon,
  },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {themes.map((t) => (
          <Card key={t.value} className="h-32">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <t.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{t.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 max-w-md">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.value;
        return (
          <Card
            key={t.value}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              isActive && "border-primary border-2"
            )}
            onClick={() => setTheme(t.value)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <CardTitle className="text-sm">{t.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                {t.description}
              </CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

