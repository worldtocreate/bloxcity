import { Globe, Calendar, ArrowRight, Users, Target, Info, Mail, Store, MessageSquare, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";
import landingBg from "@/assets/landing-background.png";
import logoSmall from "@/assets/IMG_2412_Original-1.png";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

interface LandingItem {
  id: string;
  serial_id: number;
  name: string;
  thumbnail_url: string | null;
  price_coins: number;
  price_cash: number;
  is_limited: boolean;
}

interface RecentThread {
  id: string;
  title: string;
  created_at: string;
  author_username: string;
  author_avatar: string | null;
}

// Inlined Footer component to avoid module resolution issues
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="footer-copyright">
            Copyright © {currentYear}
            <img src={logoSmall} alt="" className="footer-logo-small" />
            BLOX City. All rights reserved.
          </div>
          <div className="footer-links">
            <a href="/terms-of-service" className="footer-link">TERMS OF SERVICE</a>
            <a href="/privacy-policy" className="footer-link">PRIVACY POLICY</a>
            <a href="/faq" className="footer-link">FAQ</a>
            <a href="/notes" className="footer-link">NOTES</a>
          </div>
        </div>
        <div className="footer-right">
          <div className="footer-socials">
            <a href="https://x.com/bloxcitynet" target="_blank" rel="noopener noreferrer" className="footer-social-link" title="Follow us on X">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://discord.gg/bloxcity" target="_blank" rel="noopener noreferrer" className="footer-social-link" title="Join us on Discord">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Index = () => {
  // Maintenance mode state
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
  
  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState({ players: 0, threads: 0, posts: 0 });
  const [items, setItems] = useState<LandingItem[]>([]);
  const [recentThreads, setRecentThreads] = useState<RecentThread[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Check maintenance mode on mount
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { data } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single();
        
        if (data?.value && typeof data.value === 'object' && 'enabled' in data.value) {
          setIsMaintenanceMode((data.value as { enabled: boolean }).enabled);
        } else {
          setIsMaintenanceMode(false);
        }
      } catch {
        setIsMaintenanceMode(false);
      }
    };
    checkMaintenance();
  }, []);

  useEffect(() => {
    if (isMaintenanceMode === false) {
      fetchLandingData();
    }
  }, [isMaintenanceMode]);

  const fetchLandingData = async () => {
    setLoadingStats(true);
    try {
      // Fetch stats from public view
      const [{ count: players }, { count: threads }, { count: posts }] = await Promise.all([
        supabase.from('forum_users_public').select('*', { count: 'exact', head: true }),
        supabase.from('forum_threads').select('*', { count: 'exact', head: true }),
        supabase.from('forum_posts').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ players: players || 0, threads: threads || 0, posts: posts || 0 });

      // Fetch recent items
      const { data: itemsData } = await supabase
        .from('marketplace_items')
        .select('id, serial_id, name, thumbnail_url, price_coins, price_cash, is_limited')
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (itemsData) setItems(itemsData as LandingItem[]);

      // Fetch recent threads with authors from public view
      const { data: threadsData } = await supabase
        .from('forum_threads')
        .select('id, title, created_at, author_id')
        .order('created_at', { ascending: false })
        .limit(4);

      if (threadsData && threadsData.length > 0) {
        // Get author info from public view
        const authorIds = [...new Set(threadsData.map(t => t.author_id))];
        const { data: authorsData } = await supabase
          .from('forum_users_public')
          .select('id, username, avatar_url')
          .in('id', authorIds);
        
        const authorsMap = new Map(authorsData?.map(a => [a.id, a]) || []);
        
        const threadsWithAuthors: RecentThread[] = threadsData.map(t => ({
          id: t.id,
          title: t.title,
          created_at: t.created_at,
          author_username: authorsMap.get(t.author_id)?.username || 'Unknown',
          author_avatar: authorsMap.get(t.author_id)?.avatar_url || null,
        }));
        setRecentThreads(threadsWithAuthors);
      }
    } catch (err) {
      console.error('Error fetching landing data:', err);
    }
    setLoadingStats(false);
  };

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
            if (payload?.error) {
              setNewsletterError(payload.error);
              setNewsletterLoading(false);
              return;
            }
          } catch {
            // ignore
          }
        }
        setNewsletterError("Failed to subscribe. Please try again.");
        setNewsletterLoading(false);
        return;
      }

      const data = response.data as { error?: string; success?: boolean };
      if (data.error) {
        setNewsletterError(data.error);
        setNewsletterLoading(false);
        return;
      }

      setNewsletterSubmitted(true);
    } catch (err) {
      setNewsletterError("Failed to subscribe. Please try again.");
    }

    setNewsletterLoading(false);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getItemSlug = (name: string) => name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

  // Redirect to maintenance page if maintenance mode is enabled
  if (isMaintenanceMode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bc-bg))]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
      </div>
    );
  }

  if (isMaintenanceMode) {
    return <Navigate to="/maintenance" replace />;
  }

  return (
    <div className="has-header">
      <Header />
      
      {/* Hero Section with Background */}
      <div 
        className="landing-hero"
        style={{ backgroundImage: `url(${landingBg})` }}
      >
        <div className="landing-hero-overlay" />
        <div className="landing-content">
          {/* Logo/Brand */}
          <img src={bloxcityLogo} alt="BLOX City Logo" className="landing-logo" />
          <h1 className="landing-title">BLOX City</h1>
          <div className="landing-tagline">Est. March 2016</div>

          {/* Main Message */}
          <h2 className="landing-subtitle">We're Coming Back</h2>
          <p className="landing-description">
            The original BLOX City experience from March 2016 is returning in 2026. 
            Our beloved website and client are being rebuilt from the ground up.
          </p>

          {/* CTA Button */}
          <a href="/reserve" className="bc-btn bc-btn-info" style={{ marginBottom: '3rem' }}>
            Reserve Your Username →
          </a>

          {/* Info Cards */}
          <div className="info-cards" style={{ maxWidth: '700px', width: '100%' }}>
            <div className="info-card">
              <Calendar className="info-icon" />
              <h3>Original Launch</h3>
              <p>March 2016</p>
            </div>
            <div className="info-card">
              <ArrowRight className="info-icon" />
              <h3>Returning</h3>
              <p>2026</p>
            </div>
            <div className="info-card">
              <Globe className="info-icon" />
              <h3>Official Domain</h3>
              <p>bloxcity.net</p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Stats Section */}
      <div className="maintenance-container" style={{ paddingTop: '2rem', paddingBottom: '0', minHeight: 'auto' }}>
        <div className="maintenance-content">
          <div className="about-hero-section" style={{ marginBottom: '1.5rem' }}>
            <h2>Community Stats</h2>
          </div>
          
          {loadingStats ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-[hsl(var(--bc-primary))] mb-1">
                  <Users className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.players.toLocaleString()}</span>
                </div>
                <p className="text-xs text-[hsl(var(--bc-text-muted))]">Players</p>
              </div>
              <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-[hsl(var(--bc-accent))] mb-1">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.threads.toLocaleString()}</span>
                </div>
                <p className="text-xs text-[hsl(var(--bc-text-muted))]">Threads</p>
              </div>
              <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-[hsl(var(--bc-green))] mb-1">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.posts.toLocaleString()}</span>
                </div>
                <p className="text-xs text-[hsl(var(--bc-text-muted))]">Posts</p>
              </div>
            </div>
          )}

          {/* New Items Section */}
          {items.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
                  <Store className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
                  New Items
                </h3>
                <Link to="/market" className="text-sm text-[hsl(var(--bc-primary))] hover:underline">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to={`/item/${item.serial_id}/${getItemSlug(item.name)}`}
                    className="group bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden hover:border-[hsl(var(--bc-primary))]/50 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-square relative bg-[hsl(var(--bc-bg-light))]">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={item.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="w-12 h-12 text-[hsl(var(--bc-text-muted))]" />
                        </div>
                      )}
                      {item.is_limited && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold bg-[hsl(var(--bc-accent))] text-white rounded-full">
                          LTD
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-[hsl(var(--bc-text))] truncate group-hover:text-[hsl(var(--bc-primary))] transition">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[hsl(var(--bc-text-muted))]">
                        {item.price_coins > 0 && (
                          <span className="flex items-center gap-1">
                            🪙 {item.price_coins.toLocaleString()}
                          </span>
                        )}
                        {item.price_cash > 0 && (
                          <span className="flex items-center gap-1">
                            💵 {item.price_cash}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Forum Activity */}
          {recentThreads.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
                  Recent Discussions
                </h3>
                <Link to="/forum" className="text-sm text-[hsl(var(--bc-primary))] hover:underline">
                  View Forum →
                </Link>
              </div>
              <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
                {recentThreads.map((thread, idx) => (
                  <Link
                    key={thread.id}
                    to={`/thread/${thread.id}`}
                    className={`block p-4 hover:bg-[hsl(var(--bc-bg-light))] transition ${idx !== recentThreads.length - 1 ? 'border-b border-[hsl(var(--bc-border))]' : ''}`}
                  >
                    <p className="font-medium text-[hsl(var(--bc-text))] line-clamp-1 hover:text-[hsl(var(--bc-primary))] transition">
                      {thread.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[hsl(var(--bc-text-muted))]">
                      {thread.author_avatar && (
                        <img 
                          src={thread.author_avatar} 
                          alt="" 
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <span>by {thread.author_username}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(thread.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Sections */}
      <div className="maintenance-container" style={{ paddingTop: '0', minHeight: 'auto' }}>
        <div className="maintenance-content">
          
          {/* We Are BLOX City Section */}
          <div className="about-hero-section">
            <h2>We are BLOX City.</h2>
          </div>

          {/* About Us */}
          <div className="about-section">
            <div className="about-icon">
              <Info className="w-8 h-8" />
            </div>
            <h3>About Us</h3>
            <p>
              BLOX City was originally founded in January 2016 by two young entrepreneurs with a shared vision of creating a global gaming platform where users could create and play games made by the community. At its peak, BLOX City reached over 50,000 monthly active users, with content creation rapidly expanding and an average of 10,000 new users joining each month. Now, BLOX City is making its return under an entirely new development team and a renewed vision while staying true to the classic design and experience that defined the original platform.
            </p>
          </div>

          {/* Our Mission */}
          <div className="mission-section">
            <div className="mission-icon">
              <Target className="w-8 h-8" />
            </div>
            <h3>Our Mission</h3>
            <p>
              Our mission is to bring back the classic BLOX City experience as it was known and loved, preserving the identity, features, and community spirit that defined the platform in its original era. This revival is focused on restoring the core elements of BLOX City, from character customization and social interaction to user-created content, groups, and the marketplace while rebuilding everything from the ground up to ensure long-term stability and security. By reviving BLOX City for a new generation, we aim to recreate the same creative environment that once encouraged young users to experiment, express themselves, and connect with others. Through this faithful restoration, BLOX City continues its original mission of empowering creativity, helping users discover passions such as art, building, and coding, just as it did before.
            </p>
          </div>

          {/* About the Team */}
          <div className="team-section">
            <div className="team-icon">
              <Users className="w-8 h-8" />
            </div>
            <h3>A Community Revival Project</h3>
            <p>
              BLOX City is being brought back by a dedicated team of developers who 
              share a passion for reviving this once-loved platform. We are building this project with
              the vision to recreate the magic that made BLOX City special.
            </p>
            <div className="disclaimer">
              <strong>Disclaimer:</strong> This project is an independent revival effort by fans, for fans.
            </div>
          </div>

          {/* Domain Notice */}
          <div className="domain-notice">
            <h3>Important Notice</h3>
            <p>
              BLOX City officially owns and operates <strong>bloxcity.net</strong> — not bloxcity.com. 
              This site will be the official home for BLOX City when we return. 
              Stay tuned for updates!
            </p>
          </div>

          {/* Newsletter Section */}
          <div className="newsletter-section">
            <div className="newsletter-icon">
              <Mail className="w-8 h-8" />
            </div>
            <h3>Stay Updated</h3>
            <p>Subscribe to our newsletter for launch updates and exclusive news!</p>
            {!newsletterSubmitted ? (
              <>
                <form onSubmit={handleNewsletterSubscribe} className="newsletter-form">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="bc-input reservation-input"
                    required
                    disabled={newsletterLoading}
                  />
                  <button type="submit" className="bc-btn bc-btn-info reservation-button" disabled={newsletterLoading}>
                    {newsletterLoading ? "Subscribing..." : "Subscribe"}
                  </button>
                </form>
                {newsletterError && (
                  <div className="reservation-error">{newsletterError}</div>
                )}
              </>
            ) : (
              <div className="reservation-success">
                <div className="success-header">
                  <span>📧</span> Subscribed!
                </div>
                <p className="success-message">
                  Thank you for subscribing! Check your inbox for a confirmation email.
                </p>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="social-section">
            <h3>Follow Our Progress</h3>
            <div className="social-links">
              <a href="https://x.com/bloxcitynet" target="_blank" rel="noopener noreferrer" className="social-link twitter">
                <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Follow on X
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
