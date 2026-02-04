import { HelpCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";

const FAQ = () => {
  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--bc-body-bg))' }}>
      {/* Header */}
      <header className="bc-card sticky top-0 z-50 border-t-0 border-x-0 rounded-none">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={bloxcityLogo} alt="BLOX City" className="h-10 w-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--bc-text))' }}>BLOX City</h1>
              <p className="text-xs" style={{ color: 'hsl(var(--bc-text-muted))' }}>FAQ</p>
            </div>
          </Link>
          <Link 
            to="/"
            className="flex items-center gap-2 transition hover:opacity-80"
            style={{ color: 'hsl(var(--bc-text-muted))' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bc-card">
          <div className="bc-card-body">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="bc-section-icon mx-auto mb-4">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>
                Frequently Asked Questions
              </h1>
              <p style={{ color: 'hsl(var(--bc-text-muted))' }}>
                Everything you need to know about BLOX City
              </p>
            </div>

            {/* FAQ Accordion */}
            <Accordion type="single" collapsible className="space-y-3">
              <AccordionItem value="item-1" className="bc-card-inner rounded-xl px-4">
                <AccordionTrigger className="font-medium hover:no-underline" style={{ color: 'hsl(var(--bc-text))' }}>
                  When will BLOX City launch?
                </AccordionTrigger>
                <AccordionContent style={{ color: 'hsl(var(--bc-text-muted))' }}>
                  We're planning to launch in 2026. Follow us on X for the latest updates and announcements about our progress.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bc-card-inner rounded-xl px-4">
                <AccordionTrigger className="font-medium hover:no-underline" style={{ color: 'hsl(var(--bc-text))' }}>
                  Is this the original BLOX City?
                </AccordionTrigger>
                <AccordionContent style={{ color: 'hsl(var(--bc-text-muted))' }}>
                  This is an independent revival project by fans, for fans. We are not associated with Isaac Hymer, Kyle Vickers, or the original BLOX City ownership. Our goal is to recreate the classic experience that made the original platform special.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bc-card-inner rounded-xl px-4">
                <AccordionTrigger className="font-medium hover:no-underline" style={{ color: 'hsl(var(--bc-text))' }}>
                  How does username reservation work?
                </AccordionTrigger>
                <AccordionContent style={{ color: 'hsl(var(--bc-text-muted))' }}>
                  Simply enter your desired username and email address. Our team will review your reservation, and if approved, you'll receive a reservation code via email that you can use to claim your username when we launch.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bc-card-inner rounded-xl px-4">
                <AccordionTrigger className="font-medium hover:no-underline" style={{ color: 'hsl(var(--bc-text))' }}>
                  Will my old BLOX City account work?
                </AccordionTrigger>
                <AccordionContent style={{ color: 'hsl(var(--bc-text-muted))' }}>
                  Since this is a complete rebuild by a new team, old accounts will not carry over. However, by reserving your username now, you can secure your preferred name for the new platform.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bc-card-inner rounded-xl px-4">
                <AccordionTrigger className="font-medium hover:no-underline" style={{ color: 'hsl(var(--bc-text))' }}>
                  What features will be available at launch?
                </AccordionTrigger>
                <AccordionContent style={{ color: 'hsl(var(--bc-text-muted))' }}>
                  We're focusing on the core features that defined the original BLOX City: character customization, user-created games, social interaction, groups, and the marketplace. More features will be added after launch.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bc-card-inner rounded-xl px-4">
                <AccordionTrigger className="font-medium hover:no-underline" style={{ color: 'hsl(var(--bc-text))' }}>
                  How can I stay updated on progress?
                </AccordionTrigger>
                <AccordionContent style={{ color: 'hsl(var(--bc-text-muted))' }}>
                  Follow us on X (@bloxcitynet) for the latest updates and announcements. You can also subscribe to our newsletter on the homepage to receive updates directly in your inbox.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="bc-card-inner rounded-xl px-4">
                <AccordionTrigger className="font-medium hover:no-underline" style={{ color: 'hsl(var(--bc-text))' }}>
                  What platforms will BLOX City support?
                </AccordionTrigger>
                <AccordionContent style={{ color: 'hsl(var(--bc-text-muted))' }}>
                  We're planning to support Windows, Mac, Linux, iOS, and Android at launch. Our goal is to make BLOX City accessible to everyone.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="bc-card-inner rounded-xl px-4">
                <AccordionTrigger className="font-medium hover:no-underline" style={{ color: 'hsl(var(--bc-text))' }}>
                  Is BLOX City free to play?
                </AccordionTrigger>
                <AccordionContent style={{ color: 'hsl(var(--bc-text-muted))' }}>
                  Yes! BLOX City will be free to play. We'll have optional in-game purchases for cosmetic items, but the core experience will always be free.
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Back Link */}
            <div className="text-center mt-8">
              <Link 
                to="/"
                className="inline-flex items-center gap-2 hover:underline"
                style={{ color: 'hsl(var(--bc-primary))' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 mt-8" style={{ borderTop: '1px solid hsl(var(--bc-section-border))' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>
            © 2026 BLOX City, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FAQ;
