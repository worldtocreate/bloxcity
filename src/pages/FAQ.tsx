import { HelpCircle, ArrowLeft } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/Header";

const faqs = [
  { q: "When will BLOX City launch?", a: "We're planning to launch in 2026. Follow us on X for the latest updates and announcements about our progress." },
  { q: "Is this the original BLOX City?", a: "This is an independent revival project by fans, for fans. We are not associated with Isaac Hymer, Kyle Vickers, or the original BLOX City ownership. Our goal is to recreate the classic experience that made the original platform special." },
  { q: "How does username reservation work?", a: "Simply enter your desired username and email address. Our team will review your reservation, and if approved, you'll receive a reservation code via email that you can use to claim your username when we launch." },
  { q: "Will my old BLOX City account work?", a: "Since this is a complete rebuild by a new team, old accounts will not carry over. However, by reserving your username now, you can secure your preferred name for the new platform." },
  { q: "What features will be available at launch?", a: "We're focusing on the core features that defined the original BLOX City: character customization, user-created games, social interaction, groups, and the marketplace. More features will be added after launch." },
  { q: "How can I stay updated on progress?", a: "Follow us on X (@bloxcitynet) for the latest updates and announcements. You can also subscribe to our newsletter on the homepage to receive updates directly in your inbox." },
  { q: "What platforms will BLOX City support?", a: "We're planning to support Windows, Mac, Linux, iOS, and Android at launch. Our goal is to make BLOX City accessible to everyone." },
  { q: "Is BLOX City free to play?", a: "Yes! BLOX City will be free to play. We'll have optional in-game purchases for cosmetic items, but the core experience will always be free." },
];

const FAQ = () => (
  <div className="has-header">
    <Header />
    <div className="mx-auto max-w-2xl px-6 py-16">
      <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </a>

      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--bc-yellow))] text-white">
          <HelpCircle className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">FAQ</h1>
        <p className="mt-2 text-muted-foreground">Frequently asked questions about BLOX City</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Accordion type="single" collapsible className="space-y-0">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b border-border last:border-0">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:text-primary hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <footer className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
        © 2026 BLOX City, Inc. All rights reserved.
      </footer>
    </div>
  </div>
);

export default FAQ;
