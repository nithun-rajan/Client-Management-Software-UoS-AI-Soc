import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useViewings } from '@/hooks/useViewings';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface BookViewingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  applicantId: string;
  propertyAddress?: string;
  applicantName?: string;
}

export default function BookViewingDialog({
  open,
  onOpenChange,
  propertyId,
  applicantId,
  propertyAddress,
  applicantName
}: BookViewingDialogProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [duration, setDuration] = useState('30');
  const [agentNotes, setAgentNotes] = useState('');
  const { createViewing, loading } = useViewings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduledDate) {
      toast({
        title: "Missing date",
        description: "Please select a viewing date and time",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert datetime-local format to ISO string
      const dateObj = new Date(scheduledDate);
      const isoDate = dateObj.toISOString();
      
      await createViewing({
        property_id: propertyId,
        applicant_id: applicantId,
        scheduled_date: isoDate,
        duration_minutes: duration,
        agent_notes: agentNotes
      });

      // Invalidate queries to refresh the calendar
      queryClient.invalidateQueries({ queryKey: ["viewings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });

      toast({
        title: "Viewing Booked!",
        description: `Viewing scheduled for ${new Date(scheduledDate).toLocaleString()}`,
      });

      onOpenChange(false);
      setScheduledDate('');
      setAgentNotes('');
    } catch (error) {
      toast({
        title: "Failed to book viewing",
        description: "Could not create viewing appointment",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book Property Viewing
          </DialogTitle>
          <DialogDescription className="space-y-1">
            {propertyAddress && (
              <span className="block font-medium">Property: {propertyAddress}</span>
            )}
            {applicantName && (
              <span className="block">Applicant: {applicantName}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Date & Time</Label>
            <Input
              id="date"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Agent Notes (optional)</Label>
            <Textarea
              id="notes"
              value={agentNotes}
              onChange={(e) => setAgentNotes(e.target.value)}
              placeholder="Any special instructions or notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

