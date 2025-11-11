import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
  isCompact?: boolean;
  isHorizontal?: boolean;
}

export default function PipelineStage({
  stage,
  isFirst = false,
  isLast = false,
  index = 0,
  isCompact = false,
  isHorizontal = false,
}: PipelineStageProps) {
  const getStatusIcon = (size: "default" | "small" = "default") => {
    const sizeClass = size === "small" ? "h-3 w-3" : "h-5 w-5";
    switch (stage.status) {
      case "completed":
        return <CheckCircle2 className={cn(sizeClass, "text-green-600 dark:text-green-400")} />;
      case "current":
        return <Clock className={cn(sizeClass, "text-blue-600 dark:text-blue-400")} />;
      case "blocked":
        return <AlertCircle className={cn(sizeClass, "text-red-600 dark:text-red-400")} />;
      default:
        return <Circle className={cn(sizeClass, "text-muted-foreground")} />;
    }
  };

  const getStatusBadgeVariant = () => {
    switch (stage.status) {
      case "completed":
        return "default";
      case "current":
        return "secondary";
      case "blocked":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className={cn(
      "relative flex w-full flex-col",
      isCompact ? "items-stretch" : "items-center"
    )}>
      {/* Stage icon circle - hidden in compact mode, shown in horizontal/vertical */}
      {!isCompact && (
        <div
          className={cn(
            "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-card shadow-md transition-all",
            stage.status === "completed" && "border-green-500 bg-green-50 dark:bg-green-950/30 shadow-green-200/50",
            stage.status === "current" && "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-200 dark:ring-blue-900/50 shadow-blue-200/50",
            stage.status === "blocked" && "border-red-500 bg-red-50 dark:bg-red-950/30 shadow-red-200/50",
            stage.status === "pending" && "border-border bg-muted/50"
          )}
        >
          {getStatusIcon("default")}
        </div>
      )}

      {/* Stage content card */}
      <Card
        className={cn(
          "w-full transition-all border shadow-sm",
          isCompact ? "mt-0" : "mt-4",
          isHorizontal && !isCompact && "min-h-[200px]",
          isCompact && "h-full",
          stage.status === "current" && "ring-2 ring-blue-500/30 dark:ring-blue-400/30 shadow-lg border-blue-200 dark:border-blue-800",
          stage.status === "completed" && "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20",
          stage.status === "blocked" && "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20",
          stage.status === "pending" && "border-border"
        )}
      >
        <CardContent className={cn(
          isCompact ? "p-4" : "p-3",
          isHorizontal && !isCompact && "p-2.5"
        )}>
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Compact mode: show small status icon inline */}
                  {isCompact && (
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                      stage.status === "completed" && "border-green-500 bg-green-50 dark:bg-green-950/30",
                      stage.status === "current" && "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
                      stage.status === "blocked" && "border-red-500 bg-red-50 dark:bg-red-950/30",
                      stage.status === "pending" && "border-border bg-muted/50"
                    )}>
                      {getStatusIcon("small")}
                    </div>
                  )}
                  <h3 className={cn(
                    "font-semibold leading-tight line-clamp-2",
                    isCompact ? "text-base" : isHorizontal ? "text-xs" : "text-sm"
                  )}>
                    {stage.name}
                  </h3>
                </div>
                <p className={cn(
                  "text-muted-foreground leading-snug line-clamp-2",
                  isCompact ? "text-sm" : isHorizontal ? "text-[10px]" : "text-xs"
                )}>
                  {stage.description}
                </p>
              </div>
              <Badge
                variant={getStatusBadgeVariant()}
                className={cn(
                  "shrink-0 capitalize font-medium",
                  isHorizontal && !isCompact ? "text-[10px] px-1.5 py-0" : "text-xs"
                )}
              >
                {stage.status}
              </Badge>
            </div>

            {stage.date && (
              <div className="text-xs text-muted-foreground">
                {format(new Date(stage.date), "dd/MM/yyyy")}
              </div>
            )}

            {stage.notes && (
              <div className="rounded bg-muted p-2 text-xs">
                {stage.notes}
              </div>
            )}

            {stage.items && stage.items.length > 0 && (
              <div className="mt-1 pt-3 border-t space-y-2">
                {/* Show all items in compact mode, limit to 3 in horizontal mode for space */}
                {stage.items.slice(0, isCompact ? stage.items.length : 3).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2",
                      isCompact ? "text-sm" : "text-xs"
                    )}
                  >
                    <div className="shrink-0">
                      {item.status === "completed" ? (
                        <CheckCircle2 className={cn(
                          "text-green-600 dark:text-green-400",
                          isCompact ? "h-4 w-4" : "h-4 w-4"
                        )} />
                      ) : (
                        <Circle className={cn(
                          "text-muted-foreground",
                          isCompact ? "h-4 w-4" : "h-4 w-4"
                        )} />
                      )}
                    </div>
                    <span
                      className={cn(
                        "flex-1 leading-relaxed",
                        item.status === "completed" && "text-muted-foreground line-through"
                      )}
                    >
                      {item.name}
                    </span>
                  </div>
                ))}
                {/* Only show "+X more" in horizontal mode when items are truncated */}
                {!isCompact && stage.items.length > 3 && (
                  <div className={cn(
                    "text-muted-foreground pt-1",
                    "text-xs"
                  )}>
                    +{stage.items.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

