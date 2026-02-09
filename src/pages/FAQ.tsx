import { HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import bloxcityLogo from "@/assets/bloxcity.jpg";

const FAQ = () => {
  return (
    <div className="maintenance-container">
      <div className="maintenance-content">
        {/* Logo/Brand */}
        <div className="brand-section">
          <a href="/" className="logo-icon">
            <img src={bloxcityLogo} alt="BLOX City Logo" />
          </a>
          <h1 className="brand-title">FAQ</h1>
          <div className="brand-tagline">Frequently Asked Questions</div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <div className="faq-icon">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3>Got Questions?</h3>
          <Accordion type="single" collapsible className="faq-accordion">
            <AccordionItem value="item-1">
              <AccordionTrigger>When will BLOX City launch?</AccordionTrigger>
              <AccordionContent>
                We're planning to launch in 2026. Follow us on X for the latest updates and announcements about our progress.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is this the original BLOX City?</AccordionTrigger>
              <AccordionContent>
                This is an independent revival project by fans, for fans. We are not associated with Isaac Hymer, Kyle Vickers, or the original BLOX City ownership. Our goal is to recreate the classic experience that made the original platform special.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How does username reservation work?</AccordionTrigger>
              <AccordionContent>
                Simply enter your desired username and email address. Our team will review your reservation, and if approved, you'll receive a reservation code via email that you can use to claim your username when we launch.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Will my old BLOX City account work?</AccordionTrigger>
              <AccordionContent>
                Since this is a complete rebuild by a new team, old accounts will not carry over. However, by reserving your username now, you can secure your preferred name for the new platform.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>What features will be available at launch?</AccordionTrigger>
              <AccordionContent>
                We're focusing on the core features that defined the original BLOX City: character customization, user-created games, social interaction, groups, and the marketplace. More features will be added after launch.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>How can I stay updated on progress?</AccordionTrigger>
              <AccordionContent>
                Follow us on X (@bloxcitynet) for the latest updates and announcements. You can also subscribe to our newsletter on the homepage to receive updates directly in your inbox.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger>What platforms will BLOX City support?</AccordionTrigger>
              <AccordionContent>
                We're planning to support Windows, Mac, Linux, iOS, and Android at launch. Our goal is to make BLOX City accessible to everyone.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
              <AccordionTrigger>Is BLOX City free to play?</AccordionTrigger>
              <AccordionContent>
                Yes! BLOX City will be free to play. We'll have optional in-game purchases for cosmetic items, but the core experience will always be free.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Back to Home */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a href="/" className="check-status-link">
            ← Back to Home
          </a>
        </div>

        {/* Footer */}
        <footer className="maintenance-footer">
          <p>© 2026 BLOX City, Inc. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default FAQ;
