import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
const bloxcityLogo = '/bloxcity-logo-new.png';
import { Sparkles } from 'lucide-react';

interface WelcomeDialogProps {
  isLoggedIn: boolean;
}

export default function WelcomeDialog({ isLoggedIn }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show for non-logged-in users every time they visit
    if (!isLoggedIn) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [isLoggedIn]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-16 h-16 rounded-xl overflow-hidden mb-3">
            <img src={bloxcityLogo} alt="BLOX City" className="w-full h-full object-cover" />
          </div>
          <DialogTitle className="text-xl font-bold text-[hsl(var(--bc-text))]">
            Welcome to BLOX City!
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--bc-text-muted))] text-left space-y-3 pt-3">
            <p>
              You're accessing the <strong className="text-[hsl(var(--bc-text))]">Early Access Beta</strong> of BLOX City! This is a preview of what's to come before our full launch on <strong className="text-[hsl(var(--bc-text))]">March 6th, 2026</strong>.
            </p>
            <p>
              During this beta period, features may change and some things might not work perfectly. Your feedback helps us improve!
            </p>
            <p>
              Beta accounts will carry over to the main site at launch. Please follow the rules to keep our community safe and enjoyable for everyone.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-2">
          <Button
            onClick={handleClose}
            className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-8"
          >
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
