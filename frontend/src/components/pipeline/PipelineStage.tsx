import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PipelineStageData {
  id: string;
  name: string;
  description: string;
  status: "completed" | "current" | "pending" | "blocked";
  date?: string;
  notes?: string;
  items?: Array<{
    id: string;
    name: string;
    status: "completed" | "pending";
  }>;
}

interface PipelineStageProps {
  stage: PipelineStageData;
  isFirst?: boolean;
  isLast?: boolean;
  index?: number;
}

export default function PipelineStage({
  stage,
  isFirst = false,
  isLast = false,
  index = 0,
}: PipelineStageProps) {
  const getStatusIcon = () => {
    switch (stage.status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "current":
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (stage.status) {
      case "completed":
        return "bg-green-500";
      case "current":
        return "bg-blue-500";
      case "blocked":
        return "bg-red-500";
      default:
        return "bg-border";
    }
  };

  return (
    <div className="relative flex w-full flex-col items-center">
      {/* Stage icon - positioned at top, centered horizontally */}
      <div
        className={cn(
          "relative z-10 mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-background",
          stage.status === "current" && "ring-2 ring-blue-200 dark:ring-blue-900/50"
        )}
      >
        {getStatusIcon()}
      </div>

      {/* Stage content */}
      <Card
        className={cn(
          "mt-3 w-full max-w-full transition-all",
          stage.status === "current" && "ring-1 ring-blue-500 dark:ring-blue-600",
          stage.status === "completed" && "bg-green-50/50 dark:bg-green-950/20",
          stage.status === "blocked" && "bg-red-50/50 dark:bg-red-950/20"
        )}
      >
        <CardContent className="p-2.5">
          <div className="mb-1.5 flex flex-col gap-1">
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-semibold text-xs leading-tight line-clamp-2">{stage.name}</h3>
              <Badge
                variant={
                  stage.status === "completed"
                    ? "default"
                    : stage.status === "current"
                    ? "secondary"
                    : "outline"
                }
                className="shrink-0 text-[10px] px-1.5 py-0"
              >
                {stage.status}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
              {stage.description}
            </p>
          </div>

          {stage.date && (
            <div className="mt-2 text-xs text-muted-foreground">
              {new Date(stage.date).toLocaleDateString()}
            </div>
          )}

          {stage.notes && (
            <div className="mt-2 rounded bg-muted p-2 text-xs">
              {stage.notes}
            </div>
          )}

          {stage.items && stage.items.length > 0 && (
            <div className="mt-1.5 space-y-0.5 border-t pt-1">
              {stage.items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-1 text-[10px]"
                >
                  {item.status === "completed" ? (
                    <CheckCircle2 className="h-2 w-2 shrink-0 text-green-600" />
                  ) : (
                    <Circle className="h-2 w-2 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "truncate leading-tight",
                      item.status === "completed" && "text-muted-foreground line-through"
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
              {stage.items.length > 3 && (
                <div className="text-[10px] text-muted-foreground pt-0.5">
                  +{stage.items.length - 3} more
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

