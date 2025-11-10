import Header from "@/components/layout/Header";
import { Calendar as CalendarIcon } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export default function Calendar() {
  return (
    <div>
      <Header title="Calendar" />
      <div className="p-6">
        <EmptyState
          icon={CalendarIcon}
          title="Calendar"
          description="Your calendar view will appear here"
        />
      </div>
    </div>
  );
}

