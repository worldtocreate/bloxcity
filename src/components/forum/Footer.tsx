import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[hsl(var(--bc-bg-card))] border-t border-[hsl(var(--bc-border))] py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[hsl(var(--bc-text-muted))]">
            © {currentYear} BLOX City. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link 
              to="/terms" 
              className="text-sm text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition"
            >
              Terms of Service
            </Link>
            <Link 
              to="/privacy" 
              className="text-sm text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/faq" 
              className="text-sm text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
