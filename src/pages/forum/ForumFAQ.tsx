import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import bloxcityLogo from '@/assets/bloxcity-logo.jpg';
import { useTheme } from '@/contexts/ThemeContext';

export default function ForumFAQ() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[hsl(var(--bc-bg-light))]'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]'} border-b sticky top-0 z-50`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={bloxcityLogo} alt="BLOX City" className="h-10 w-10 rounded-lg" />
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[hsl(var(--bc-text))]'}`}>BLOX City</h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[hsl(var(--bc-text-muted))]'}`}>FAQ</p>
            </div>
          </Link>
          <Link 
            to="/"
            className={`flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))]'} transition`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forum
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]'} rounded-2xl border p-6 md:p-8`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-blue-900/50' : 'bg-[hsla(var(--bc-primary),0.1)]'} flex items-center justify-center mx-auto mb-4`}>
              <HelpCircle className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-[hsl(var(--bc-primary))]'}`} />
            </div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[hsl(var(--bc-text))]'} mb-2`}>Frequently Asked Questions</h1>
            <p className={isDark ? 'text-gray-400' : 'text-[hsl(var(--bc-text-muted))]'}>Everything you need to know about BLOX City</p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="item-1" className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-[hsl(var(--bc-bg-light))] border-[hsl(var(--bc-border))]'} border rounded-xl px-4`}>
              <AccordionTrigger className={`${isDark ? 'text-white hover:text-blue-400' : 'text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]'} font-medium`}>
                When will BLOX City launch?
              </AccordionTrigger>
              <AccordionContent className={isDark ? 'text-gray-300' : 'text-[hsl(var(--bc-text-muted))]'}>
                We're planning to launch in 2026. Follow us on X for the latest updates and announcements about our progress.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-[hsl(var(--bc-bg-light))] border-[hsl(var(--bc-border))]'} border rounded-xl px-4`}>
              <AccordionTrigger className={`${isDark ? 'text-white hover:text-blue-400' : 'text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]'} font-medium`}>
                Is this the original BLOX City?
              </AccordionTrigger>
              <AccordionContent className={isDark ? 'text-gray-300' : 'text-[hsl(var(--bc-text-muted))]'}>
                This is an independent revival project by fans, for fans. We are not associated with Isaac Hymer, Kyle Vickers, or the original BLOX City ownership. Our goal is to recreate the classic experience that made the original platform special.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-[hsl(var(--bc-bg-light))] border-[hsl(var(--bc-border))]'} border rounded-xl px-4`}>
              <AccordionTrigger className={`${isDark ? 'text-white hover:text-blue-400' : 'text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]'} font-medium`}>
                How does username reservation work?
              </AccordionTrigger>
              <AccordionContent className={isDark ? 'text-gray-300' : 'text-[hsl(var(--bc-text-muted))]'}>
                Simply enter your desired username and email address. Our team will review your reservation, and if approved, you'll receive a reservation code via email that you can use to claim your username when we launch.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-[hsl(var(--bc-bg-light))] border-[hsl(var(--bc-border))]'} border rounded-xl px-4`}>
              <AccordionTrigger className={`${isDark ? 'text-white hover:text-blue-400' : 'text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]'} font-medium`}>
                Will my old BLOX City account work?
              </AccordionTrigger>
              <AccordionContent className={isDark ? 'text-gray-300' : 'text-[hsl(var(--bc-text-muted))]'}>
                Since this is a complete rebuild by a new team, old accounts will not carry over. However, by reserving your username now, you can secure your preferred name for the new platform.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-[hsl(var(--bc-bg-light))] border-[hsl(var(--bc-border))]'} border rounded-xl px-4`}>
              <AccordionTrigger className={`${isDark ? 'text-white hover:text-blue-400' : 'text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]'} font-medium`}>
                What features will be available at launch?
              </AccordionTrigger>
              <AccordionContent className={isDark ? 'text-gray-300' : 'text-[hsl(var(--bc-text-muted))]'}>
                We're focusing on the core features that defined the original BLOX City: character customization, user-created games, social interaction, groups, and the marketplace. More features will be added after launch.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-[hsl(var(--bc-bg-light))] border-[hsl(var(--bc-border))]'} border rounded-xl px-4`}>
              <AccordionTrigger className={`${isDark ? 'text-white hover:text-blue-400' : 'text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]'} font-medium`}>
                How can I stay updated on progress?
              </AccordionTrigger>
              <AccordionContent className={isDark ? 'text-gray-300' : 'text-[hsl(var(--bc-text-muted))]'}>
                Follow us on X (@bloxcitynet) for the latest updates and announcements. You can also check the forum regularly for community discussions and official announcements.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-[hsl(var(--bc-bg-light))] border-[hsl(var(--bc-border))]'} border rounded-xl px-4`}>
              <AccordionTrigger className={`${isDark ? 'text-white hover:text-blue-400' : 'text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]'} font-medium`}>
                What platforms will BLOX City support?
              </AccordionTrigger>
              <AccordionContent className={isDark ? 'text-gray-300' : 'text-[hsl(var(--bc-text-muted))]'}>
                We're planning to support Windows, Mac, Linux, iOS, and Android at launch. Our goal is to make BLOX City accessible to everyone.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-[hsl(var(--bc-bg-light))] border-[hsl(var(--bc-border))]'} border rounded-xl px-4`}>
              <AccordionTrigger className={`${isDark ? 'text-white hover:text-blue-400' : 'text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]'} font-medium`}>
                Is BLOX City free to play?
              </AccordionTrigger>
              <AccordionContent className={isDark ? 'text-gray-300' : 'text-[hsl(var(--bc-text-muted))]'}>
                Yes! BLOX City will be free to play. We'll have optional in-game purchases for cosmetic items, but the core experience will always be free.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Back Link */}
          <div className="text-center mt-8">
            <Link 
              to="/"
              className={`inline-flex items-center gap-2 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-[hsl(var(--bc-primary))] hover:underline'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Forum
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t ${isDark ? 'border-gray-700' : 'border-[hsl(var(--bc-border))]'} py-6 mt-12`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-[hsl(var(--bc-text-muted))]'}`}>
            © 2026 BLOX City, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
