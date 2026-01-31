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
import { Sparkles } from 'lucide-react';

const WELCOME_SHOWN_KEY = 'bloxcity_forum_welcome_shown';

interface WelcomeDialogProps {
  isLoggedIn: boolean;
}

export default function WelcomeDialog({ isLoggedIn }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only show for non-logged-in users who haven't seen it
    if (!isLoggedIn) {
      const hasSeenWelcome = localStorage.getItem(WELCOME_SHOWN_KEY);
      if (!hasSeenWelcome) {
        setOpen(true);
      }
    }
  }, [isLoggedIn]);

  const handleClose = () => {
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[hsla(var(--bc-primary),0.1)] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-[hsl(var(--bc-primary))]" />
          </div>
          <DialogTitle className="text-xl font-bold text-[hsl(var(--bc-text))]">
            Welcome to the BLOX City forums!
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--bc-text-muted))] text-left space-y-3 pt-3">
            <p>
              Before you proceed, please note that this forum has been set up to allow members to communicate with each other ahead of the main BLOX City site launch on <strong className="text-[hsl(var(--bc-text))]">March 6th, 2026</strong>.
            </p>
            <p>
              Forum accounts will not transfer over to the main site; however, any usernames reserved here will be carried over.
            </p>
            <p>
              Please make sure to follow the rules at all times to help keep the community safe and enjoyable for everyone.
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
