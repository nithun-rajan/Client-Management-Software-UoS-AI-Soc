import Header from "@/components/layout/Header";
import { CheckSquare } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export default function MyTasks() {
  return (
    <div>
      <Header title="My Tasks" />
      <div className="p-6">
        <EmptyState
          icon={CheckSquare}
          title="My Tasks"
          description="Your personal tasks will appear here"
        />
      </div>
    </div>
  );
}

