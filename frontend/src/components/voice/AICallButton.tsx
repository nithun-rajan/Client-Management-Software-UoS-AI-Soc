import { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Applicant } from "@/types";
import AICallConfirmModal from "./AICallConfirmModal";

interface AICallButtonProps {
  applicant: Applicant;
  onCallCreated?: (callId: string) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export default function AICallButton({
  applicant,
  onCallCreated,
  variant = "outline",
  size = "sm",
  className,
}: AICallButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setModalOpen(true)}
        className={className}
      >
        <Phone className="mr-2 h-4 w-4" />
        AI Call
      </Button>

      <AICallConfirmModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        applicant={applicant}
        onCallCreated={onCallCreated}
      />
    </>
  );
}

