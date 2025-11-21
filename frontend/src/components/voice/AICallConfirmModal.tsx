import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Applicant } from "@/types";
import { useCreateAICall } from "@/hooks/useAICalls";

interface AICallConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
  onCallCreated?: (callId: string) => void;
}

export default function AICallConfirmModal({
  open,
  onOpenChange,
  applicant,
  onCallCreated,
}: AICallConfirmModalProps) {
  const [userContext, setUserContext] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(applicant.phone || "");
  
  const createCallMutation = useCreateAICall();

  const handleConfirm = async () => {
    try {
      const result = await createCallMutation.mutateAsync({
        applicant_id: applicant.id,
        phone_number: phoneNumber,
        user_context: userContext.trim() || undefined,
      });

      // Call completed successfully
      if (onCallCreated) {
        onCallCreated(result.id);
      }
      
      // Close modal
      onOpenChange(false);
      
      // Reset form
      setUserContext("");
    } catch (error) {
      // Error handling is done by the mutation
      console.error("Failed to create AI call:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            AI Call Agent
          </DialogTitle>
          <DialogDescription>
            Initiate an AI-powered call to qualify {applicant.first_name} {applicant.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Applicant Info */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="font-medium">
              {applicant.first_name} {applicant.last_name}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Email: {applicant.email}</div>
              <div>Phone: {applicant.phone}</div>
            </div>
          </div>

          {/* Phone Number (for prototype - shown but not used) */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+447584628012"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Note: For prototype, calls will go to hardcoded test number (+447584628012)
            </p>
          </div>

          {/* Additional Context */}
          <div className="space-y-2">
            <Label htmlFor="context">
              Additional Instructions (Optional)
            </Label>
            <Textarea
              id="context"
              placeholder="e.g., 'Ask about parking requirements' or 'They mentioned needing a garden for their dog'"
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Add any specific context or questions for the AI agent to focus on
            </p>
          </div>

          {/* What will happen */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="text-sm font-medium mb-2">What happens next:</div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• AI agent will call the applicant</li>
              <li>• Qualify their rental requirements naturally</li>
              <li>• Gather information for your CRM</li>
              <li>• Generate a summary and extract structured data</li>
              <li>• Call usually takes 5-10 minutes</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createCallMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={createCallMutation.isPending}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            {createCallMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initiating Call...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Start AI Call
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

