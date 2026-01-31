import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Flag, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ReportButtonProps {
  reporterId: string;
  reportedType: 'thread' | 'post' | 'status' | 'profile';
  reportedId: string;
  reportedName?: string;
  variant?: 'icon' | 'button' | 'text';
  className?: string;
}

const REPORT_REASONS = [
  'Spam or advertising',
  'Harassment or bullying',
  'Hate speech or discrimination',
  'Inappropriate content',
  'Misinformation',
  'Impersonation',
  'Other'
];

export default function ReportButton({ 
  reporterId, 
  reportedType, 
  reportedId, 
  reportedName,
  variant = 'icon',
  className = ''
}: ReportButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('forum_reports')
        .insert({
          reporter_id: reporterId,
          reported_type: reportedType,
          reported_id: reportedId,
          reason: selectedReason,
          details: details || null
        });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('You have already reported this content');
        } else {
          toast.error('Failed to submit report');
        }
      } else {
        toast.success('Report submitted. Thank you for helping keep our community safe!');
        setShowDialog(false);
        setSelectedReason('');
        setDetails('');
      }
    } catch {
      toast.error('Failed to submit report');
    }

    setSubmitting(false);
  };

  const getTypeLabel = () => {
    switch (reportedType) {
      case 'thread': return 'Thread';
      case 'post': return 'Post';
      case 'status': return 'Status';
      case 'profile': return 'Profile';
      default: return 'Content';
    }
  };

  const renderTrigger = () => {
    if (variant === 'icon') {
      return (
        <button
          onClick={() => setShowDialog(true)}
          className={`p-2 text-[hsl(var(--bc-text-muted))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition ${className}`}
          title="Report"
        >
          <Flag className="w-4 h-4" />
        </button>
      );
    }

    if (variant === 'button') {
      return (
        <button
          onClick={() => setShowDialog(true)}
          className={`flex items-center gap-2 px-3 py-2 text-[hsl(var(--bc-text-muted))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition ${className}`}
        >
          <Flag className="w-4 h-4" />
          Report
        </button>
      );
    }

    return (
      <button
        onClick={() => setShowDialog(true)}
        className={`text-sm text-[hsl(var(--bc-text-muted))] hover:text-red-500 transition ${className}`}
      >
        Report
      </button>
    );
  };

  return (
    <>
      {renderTrigger()}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--bc-text))] flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" />
              Report {getTypeLabel()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {reportedName && (
              <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                Reporting: <span className="font-medium text-[hsl(var(--bc-text))]">{reportedName}</span>
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Reason for report
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map(reason => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      selectedReason === reason
                        ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]/10'
                        : 'border-[hsl(var(--bc-border))] hover:bg-[hsl(var(--bc-bg-light))]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedReason === reason
                        ? 'border-[hsl(var(--bc-primary))]'
                        : 'border-[hsl(var(--bc-border))]'
                    }`}>
                      {selectedReason === reason && (
                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--bc-primary))]" />
                      )}
                    </div>
                    <span className="text-sm text-[hsl(var(--bc-text))]">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Additional details (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any additional context..."
                rows={3}
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-3 py-2 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] resize-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 py-2 border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:bg-[hsl(var(--bc-text-muted))] text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Flag className="w-4 h-4" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
