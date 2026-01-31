import { Globe, Calendar, ArrowRight, Users, Target, Info, HelpCircle, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalReservations, setTotalReservations] = useState<number | null>(null);
  
  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      const { data, error } = await supabase.rpc('get_reservation_count');
      if (!error && data !== null) {
        setTotalReservations(data);
      }
    };
    fetchCount();
  }, [submitted]);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    setError("");
    setErrorType(null);

    try {
      const response = await supabase.functions.invoke('reserve-username', {
        body: { username: username.trim(), email: email.trim() },
      });

      // Handle edge function errors (non-2xx responses)
      if (response.error) {
        const anyError = response.error as any;

        // Prefer parsing the JSON body from the failed Response (Supabase FunctionsHttpError)
        const failedResponse: Response | undefined = anyError?.context?.response;
        if (failedResponse && typeof failedResponse.json === 'function') {
          try {
            const payload = (await failedResponse.json()) as { error?: string; errorType?: string };
            if (payload?.error) {
              setError(payload.error);
              setErrorType(payload.errorType || null);
              setLoading(false);
              return;
            }
          } catch {
            // ignore JSON parse errors and fall back to generic message
          }
        }

        // Fallback: some error types expose a context object with message fields
        const contextPayload = anyError?.context as { error?: string; errorType?: string } | undefined;
        if (contextPayload?.error) {
          setError(contextPayload.error);
          setErrorType(contextPayload.errorType || null);
          setLoading(false);
          return;
        }

        setError(anyError?.message || "Failed to reserve username. Please try again.");
        setErrorType(null);
        setLoading(false);
        return;
      }

      const data = response.data as any;

      if (data.error) {
        setError(data.error);
        setErrorType(data.errorType || null);
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError("Failed to reserve username. Please try again.");
    }
    
    setLoading(false);
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
  return (
    <div className="maintenance-container">
      <div className="maintenance-content">
        {/* Logo/Brand */}
        <div className="brand-section">
          <div className="logo-icon">
            <img src={bloxcityLogo} alt="BLOX City Logo" />
          </div>
          <h1 className="brand-title">BLOX City</h1>
          <div className="brand-tagline">Est. March 2016</div>
        </div>

        {/* Main Message */}
        <div className="message-section">
          <h2 className="message-title">We're Coming Back</h2>
          <p className="message-text">
            The original BLOX City experience from March 2016 is returning in 2026. 
            Our beloved website and client are being rebuilt from the ground up.
          </p>
        </div>


        {/* Username Reservation */}
        <div className="reservation-section">
          <h3>Reserve Your Username</h3>
          <p>Be first in line when we launch. Reserve your username now!</p>
          {!submitted ? (
            <>
              <form onSubmit={handleReserve} className="reservation-form">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your desired username"
                  className="reservation-input"
                  minLength={3}
                  maxLength={20}
                  required
                  disabled={loading}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="reservation-input"
                  required
                  disabled={loading}
                />
                <button type="submit" className="reservation-button" disabled={loading}>
                  {loading ? "Reserving..." : "Reserve Username"}
                </button>
              </form>
              {error && (
                <div className={`reservation-error ${errorType === 'banned' ? 'reservation-error-banned' : ''}`}>
                  {error}
                </div>
              )}
              <a href="/reserve/check-status" className="check-status-link check-status-link-secondary">
                Already reserved? Check your status →
              </a>
            </>
          ) : (
            <div className="reservation-success">
              <div className="success-header">
                <span>🎉</span> Fantastic!
              </div>
              <p className="success-message">
                You have requested the username <strong>{username}</strong>. Our team is reviewing your reserved username.
              </p>
              <p className="success-note">
                If approved, your reservation code will be sent to your email address.
              </p>
              <a href="/reserve/check-status" className="check-status-link">
                Check your reservation status →
              </a>
            </div>
          )}
        </div>

        {/* Reservation Counter */}
        {totalReservations !== null && totalReservations > 0 && (
          <div className="reservation-counter">
            <div className="counter-number">{totalReservations.toLocaleString()}</div>
            <div className="counter-label">usernames reserved</div>
          </div>
        )}

        {/* Info Cards */}
        <div className="info-cards">
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
            BLOX City is being brought back by a dedicated team of 4 developers who 
            share a passion for reviving this once-loved platform. We are building this project with
            the vision to recreate the magic that made BLOX City special.
          </p>
          <div className="disclaimer">
            <strong>Disclaimer:</strong> This project is <em>not</em> associated with Isaac Hymer, Kyle Vickers & his team, or the 
            original BLOX City ownership. This is an independent revival effort by fans, for fans.
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

        {/* FAQ Section */}
        <div className="faq-section">
          <div className="faq-icon">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3>Frequently Asked Questions</h3>
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
          </Accordion>
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
                  className="reservation-input"
                  required
                  disabled={newsletterLoading}
                />
                <button type="submit" className="reservation-button" disabled={newsletterLoading}>
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


        {/* Original BLOX City Notice */}
        <div className="original-notice">
          <p>
            Looking for where BLOX City is now? Isaac is over at{" "}
            <a href="https://brickplanet.com" target="_blank" rel="noopener noreferrer">brickplanet.com</a>
            {" "}& Kyle is over at{" "}
            <a href="https://www.truworlds.net/" target="_blank" rel="noopener noreferrer">truworlds.net</a>
          </p>
        </div>

        {/* Footer */}
        <footer className="maintenance-footer">
          <p>© 2026 BLOX City, Inc. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
