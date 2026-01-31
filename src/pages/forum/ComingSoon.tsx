import { Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[hsl(var(--bc-primary))]/10 flex items-center justify-center">
          <Construction className="w-12 h-12 text-[hsl(var(--bc-primary))]" />
        </div>
        
        <h1 className="text-3xl font-bold text-[hsl(var(--bc-text))] mb-3">
          {title}
        </h1>
        
        <p className="text-[hsl(var(--bc-text-muted))] mb-8">
          {description || "This feature is coming soon! We're working hard to bring you an amazing experience."}
        </p>
        
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 mb-6">
          <p className="text-sm text-[hsl(var(--bc-text-muted))]">
            Stay tuned for updates. This feature will be available when BLOX City officially launches.
          </p>
        </div>
        
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-[hsl(var(--bc-primary))] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forum
        </Link>
      </div>
    </div>
  );
}
