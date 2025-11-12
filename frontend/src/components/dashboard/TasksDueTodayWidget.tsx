/**
 * Tasks Due Today Widget
 * 
 * Displays pending tasks for the logged-in agent.
 * Pulls from task management or CRM data.
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckSquare, AlertCircle, Clock } from "lucide-react";
import { useTasksDueToday } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function TasksDueTodayWidget() {
  const { data: tasks, isLoading } = useTasksDueToday();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks Due Today</CardTitle>
          <CardDescription>Pending tasks for today</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  const tasksDueToday = tasks || [];
  const urgentTasks = tasksDueToday.filter((t) => t.priority === "urgent");
  const highTasks = tasksDueToday.filter((t) => t.priority === "high");

  if (tasksDueToday.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-green-500" />
            Tasks Due Today
          </CardTitle>
          <CardDescription>Pending tasks for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tasks due today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-green-500" />
          Tasks Due Today
        </CardTitle>
        <CardDescription>
          {tasksDueToday.length} task{tasksDueToday.length !== 1 ? "s" : ""} due today
          {urgentTasks.length > 0 && (
            <span className="ml-2 text-red-600 dark:text-red-400">
              ({urgentTasks.length} urgent)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tasksDueToday.map((task) => {
            const priorityColor = priorityColors[task.priority] || priorityColors.medium;

            return (
              <div
                key={task.id}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{task.title}</span>
                      <Badge className={priorityColor} variant="secondary">
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  {task.priority === "urgent" && (
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

