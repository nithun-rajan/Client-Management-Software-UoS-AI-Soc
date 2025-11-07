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
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case "current":
        return <Clock className="h-6 w-6 text-blue-600 animate-pulse" />;
      case "blocked":
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
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
          "relative z-10 mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-background bg-background",
          stage.status === "current" && "ring-4 ring-blue-200 dark:ring-blue-900/50"
        )}
      >
        {getStatusIcon()}
      </div>

      {/* Stage content */}
      <Card
        className={cn(
          "mt-4 w-full max-w-full transition-all",
          stage.status === "current" && "ring-2 ring-blue-500 dark:ring-blue-600",
          stage.status === "completed" && "bg-green-50/50 dark:bg-green-950/20",
          stage.status === "blocked" && "bg-red-50/50 dark:bg-red-950/20"
        )}
      >
        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{stage.name}</h3>
              <p className="text-sm text-muted-foreground">
                {stage.description}
              </p>
            </div>
            <Badge
              variant={
                stage.status === "completed"
                  ? "default"
                  : stage.status === "current"
                  ? "secondary"
                  : "outline"
              }
              className="ml-2"
            >
              {stage.status}
            </Badge>
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
            <div className="mt-3 space-y-1 border-t pt-2">
              {stage.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-xs"
                >
                  {item.status === "completed" ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      item.status === "completed" && "text-muted-foreground line-through"
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

