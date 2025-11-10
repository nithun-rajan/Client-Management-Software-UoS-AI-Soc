import Header from "@/components/layout/Header";
import { FileText } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export default function Notes() {
  return (
    <div>
      <Header title="Notes" />
      <div className="p-6">
        <EmptyState
          icon={FileText}
          title="Notes"
          description="Your notes will appear here"
        />
      </div>
    </div>
  );
}

