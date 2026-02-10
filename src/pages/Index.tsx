import { Globe, Calendar, ArrowRight, Users, Target, Info, Mail, ChevronRight, Map } from "lucide-react";
import { useState } from "react";
import bloxcityLogo from "@/assets/bloxcity.jpg";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterLoading(true);
    setNewsletterError("");
    try {
      const response = await supabase.functions.invoke("newsletter-subscribe", {
        body: { email: newsletterEmail.trim() },
      });
      if (response.error) {
        const anyError = response.error as any;
        const failedResponse: Response | undefined = anyError?.context?.response;
        if (failedResponse && typeof failedResponse.json === "function") {
          try {
            const payload = (await failedResponse.json()) as { error?: string };
            if (payload?.error) { setNewsletterError(payload.error); setNewsletterLoading(false); return; }
          } catch {}
        }
        setNewsletterError("Failed to subscribe. Please try again.");
        setNewsletterLoading(false);
        return;
      }
      const data = response.data as { error?: string; success?: boolean };
      if (data.error) { setNewsletterError(data.error); setNewsletterLoading(false); return; }
      setNewsletterSubmitted(true);
    } catch { setNewsletterError("Failed to subscribe. Please try again."); }
    setNewsletterLoading(false);
  };

  return (
    <div className="has-header">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--bc-green))] animate-pulse" />
            Coming back in 2026
          </div>
          <img src={bloxcityLogo} alt="BLOX City" className="mx-auto mb-6 h-24 w-24 rounded-2xl shadow-lg" />
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            BLOX City
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">Est. March 2016</p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            The original BLOX City experience is returning. Our beloved website and client are being rebuilt from the ground up for a new generation.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="/reserve" className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30">
              Reserve Your Username
              <ChevronRight className="h-4 w-4" />
            </a>
            <a href="/roadmap" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted">
              <Map className="h-4 w-4" />
              View Roadmap
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-border">
          {[
            { label: "Original Launch", value: "March 2016", icon: Calendar },
            { label: "Returning", value: "2026", icon: ArrowRight },
            { label: "Official Domain", value: "bloxcity.net", icon: Globe },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 py-8 px-4 text-center">
              <item.icon className="mb-2 h-5 w-5 text-primary" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</span>
              <span className="text-lg font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* About / Mission / Team */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground">We are BLOX City.</h2>

        <div className="space-y-6">
          <ContentCard
            icon={<Info className="h-5 w-5" />}
            iconBg="bg-primary"
            title="About Us"
            text="BLOX City was originally founded in January 2016 by two young entrepreneurs with a shared vision of creating a global gaming platform where users could create and play games made by the community. At its peak, BLOX City reached over 50,000 monthly active users, with content creation rapidly expanding and an average of 10,000 new users joining each month. Now, BLOX City is making its return under an entirely new development team and a renewed vision while staying true to the classic design and experience that defined the original platform."
          />
          <ContentCard
            icon={<Target className="h-5 w-5" />}
            iconBg="bg-[hsl(var(--bc-red))]"
            title="Our Mission"
            text="Our mission is to bring back the classic BLOX City experience as it was known and loved, preserving the identity, features, and community spirit that defined the platform in its original era. This revival is focused on restoring the core elements of BLOX City, from character customization and social interaction to user-created content, groups, and the marketplace while rebuilding everything from the ground up to ensure long-term stability and security."
          />
          <ContentCard
            icon={<Users className="h-5 w-5" />}
            iconBg="bg-[hsl(var(--bc-green))]"
            title="A Community Revival Project"
            text="BLOX City is being brought back by a dedicated team of talented people under Kyle Vickers's leadership who share a passion for reviving this once-loved platform. We are building this project with the vision to recreate the magic that made BLOX City special."
          >
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-muted-foreground">
              <strong className="text-destructive">Disclaimer:</strong> This project is <em>not</em> associated with Isaac Hymer, or the original BLOX City ownership. This is an independent revival effort by fans, for fans.
            </div>
          </ContentCard>
        </div>
      </section>

      {/* Domain Notice */}
      <section className="mx-auto max-w-4xl px-6 pb-12">
        <div className="rounded-2xl border border-[hsl(var(--bc-yellow))]/30 bg-[hsl(var(--bc-yellow))]/5 p-6">
          <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground">
            <span>⚠️</span> Important Notice
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            BLOX City officially owns and operates <strong className="text-foreground">bloxcity.net</strong> — not bloxcity.com.
            This site will be the official home for BLOX City when we return. Stay tuned for updates!
          </p>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Stay Updated</h3>
          <p className="mt-2 text-sm text-muted-foreground">Subscribe to our newsletter for launch updates and exclusive news!</p>
          {!newsletterSubmitted ? (
            <div className="mt-6">
              <form onSubmit={handleNewsletterSubscribe} className="flex gap-3">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                  disabled={newsletterLoading}
                />
                <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50" disabled={newsletterLoading}>
                  {newsletterLoading ? "..." : "Subscribe"}
                </button>
              </form>
              {newsletterError && <p className="mt-3 text-sm text-destructive">{newsletterError}</p>}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-[hsl(var(--bc-green))]/30 bg-[hsl(var(--bc-green))]/5 p-5">
              <p className="font-semibold text-[hsl(var(--bc-green))]">📧 Subscribed!</p>
              <p className="mt-1 text-sm text-muted-foreground">Thank you! Check your inbox for a confirmation email.</p>
            </div>
          )}
        </div>
      </section>

      {/* Social + Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="mb-8 text-center">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Follow Our Progress</h3>
            <a
              href="https://x.com/joinbloxcity"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Follow on X
            </a>
          </div>
          <p className="text-center text-sm text-muted-foreground">© 2026 BLOX City, Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const ContentCard = ({ icon, iconBg, title, text, children }: { icon: React.ReactNode; iconBg: string; title: string; text: string; children?: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
    <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white ${iconBg}`}>
      {icon}
    </div>
    <h3 className="mb-3 text-lg font-bold text-foreground">{title}</h3>
    <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    {children}
  </div>
);

export default Index;
