import { Globe, Calendar, ArrowRight, Users, Target, Info } from "lucide-react";
import { useState, useEffect } from "react";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";

import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reservationCode, setReservationCode] = useState("");
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalReservations, setTotalReservations] = useState<number | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const fetchCount = async () => {
      const { data, error } = await supabase.rpc('get_reservation_count');
      if (!error && data !== null) {
        setTotalReservations(data);
      }
    };
    fetchCount();
  }, [submitted]);

  // Countdown timer to March 6th, 2026
  useEffect(() => {
    const targetDate = new Date('2026-03-06T00:00:00').getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    setError("");
    setErrorType(null);

    try {
      const response = await supabase.functions.invoke('reserve-username', {
        body: { username: username.trim(), email: email.trim() }
      });

      // Handle edge function errors (non-2xx responses)
      if (response.error) {
        // Try to parse the error context for our custom error messages
        const errorContext = response.error.context;
        if (errorContext && typeof errorContext === 'object') {
          const parsed = errorContext as { error?: string; errorType?: string };
          if (parsed.error) {
            setError(parsed.error);
            setErrorType(parsed.errorType || null);
            setLoading(false);
            return;
          }
        }
        setError(response.error.message || "Failed to reserve username. Please try again.");
        setErrorType(null);
        setLoading(false);
        return;
      }

      const data = response.data;

      if (data.error) {
        setError(data.error);
        setErrorType(data.errorType || null);
        setLoading(false);
        return;
      }

      setReservationCode(data.reservationCode);
      setSubmitted(true);
    } catch (err) {
      setError("Failed to reserve username. Please try again.");
    }
    
    setLoading(false);
  };

  return (
    <div className="bc-page">
      <div className="bc-container">
        {/* Hero Section */}
        <header className="bc-hero">
          <div className="bc-logo-wrapper">
            <img src={bloxcityLogo} alt="BLOX City Logo" className="bc-logo" />
          </div>
          <h1 className="bc-title">BLOX City</h1>
          <p className="bc-subtitle">Est. March 2016 • Returning March 2026</p>
        </header>

        {/* Countdown Section */}
        <section className="bc-countdown-section">
          <h2 className="bc-countdown-title">Launching In</h2>
          <div className="bc-countdown">
            <div className="bc-countdown-item">
              <span className="bc-countdown-number">{countdown.days}</span>
              <span className="bc-countdown-label">Days</span>
            </div>
            <div className="bc-countdown-separator">:</div>
            <div className="bc-countdown-item">
              <span className="bc-countdown-number">{String(countdown.hours).padStart(2, '0')}</span>
              <span className="bc-countdown-label">Hours</span>
            </div>
            <div className="bc-countdown-separator">:</div>
            <div className="bc-countdown-item">
              <span className="bc-countdown-number">{String(countdown.minutes).padStart(2, '0')}</span>
              <span className="bc-countdown-label">Minutes</span>
            </div>
            <div className="bc-countdown-separator">:</div>
            <div className="bc-countdown-item">
              <span className="bc-countdown-number">{String(countdown.seconds).padStart(2, '0')}</span>
              <span className="bc-countdown-label">Seconds</span>
            </div>
          </div>
          <p className="bc-countdown-date">March 6th, 2026</p>
        </section>

        {/* Message */}
        <section className="bc-message">
          <p>
            The original BLOX City experience from March 2016 is returning. 
            Our beloved website and client are being rebuilt from the ground up.
          </p>
        </section>

        {/* Username Reservation */}
        <section className="bc-reserve">
          <h2>Reserve Your Username</h2>
          <p>Be first in line when we launch!</p>
          
          {!submitted ? (
            <>
              <form onSubmit={handleReserve} className="bc-form">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="bc-input"
                  minLength={3}
                  maxLength={20}
                  required
                  disabled={loading}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="bc-input"
                  required
                  disabled={loading}
                />
                <button type="submit" className="bc-button" disabled={loading}>
                  {loading ? "Reserving..." : "Reserve Now"}
                </button>
              </form>
              {error && (
                <div className={`bc-error ${errorType === 'banned' ? 'bc-error-banned' : ''}`}>
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="bc-success">
              <div className="bc-success-header">
                ✓ Username "<strong>{username}</strong>" reserved!
              </div>
              <div className="bc-code-box">
                <p className="bc-code-warning">⚠️ SAVE THIS CODE</p>
                <p className="bc-code-text">You'll need this to claim your username at launch:</p>
                <div className="bc-code">{reservationCode}</div>
                <p className="bc-code-note">This code will not be shown again.</p>
              </div>
            </div>
          )}
        </section>

        {/* Stats */}
        {totalReservations !== null && totalReservations > 0 && (
          <div className="bc-stats">
            <span className="bc-stats-number">{totalReservations.toLocaleString()}</span>
            <span className="bc-stats-label">usernames reserved</span>
          </div>
        )}

        {/* Info Grid */}
        <div className="bc-grid">
          <div className="bc-card">
            <Calendar className="bc-card-icon" />
            <h3>Original Launch</h3>
            <p>March 2016</p>
          </div>
          <div className="bc-card">
            <ArrowRight className="bc-card-icon" />
            <h3>Returning</h3>
            <p>March 2026</p>
          </div>
          <div className="bc-card">
            <Globe className="bc-card-icon" />
            <h3>Official Domain</h3>
            <p>bloxcity.net</p>
          </div>
        </div>

        {/* About */}
        <section className="bc-section">
          <div className="bc-section-icon bc-section-icon-blue">
            <Info className="w-6 h-6" />
          </div>
          <h2>About BLOX City</h2>
          <p>
            BLOX City was originally founded in January 2016 by two young entrepreneurs with a shared vision of creating a global gaming platform where users could create and play games made by the community. At its peak, BLOX City reached over 50,000 monthly active users. Now, BLOX City is making its return under an entirely new development team while staying true to the classic design and experience.
          </p>
        </section>

        {/* Mission */}
        <section className="bc-section">
          <div className="bc-section-icon bc-section-icon-orange">
            <Target className="w-6 h-6" />
          </div>
          <h2>Our Mission</h2>
          <p>
            Our mission is to bring back the classic BLOX City experience as it was known and loved—preserving the identity, features, and community spirit that defined the platform. By reviving BLOX City for a new generation, we aim to recreate the same creative environment that once encouraged young users to experiment, express themselves, and connect with others.
          </p>
        </section>

        {/* Team */}
        <section className="bc-section">
          <div className="bc-section-icon bc-section-icon-green">
            <Users className="w-6 h-6" />
          </div>
          <h2>Community Revival</h2>
          <p>
            BLOX City is being brought back by a dedicated team of 4 developers who share a passion for reviving this once-loved platform.
          </p>
          <div className="bc-disclaimer">
            <strong>Disclaimer:</strong> This project is <em>not</em> associated with Isaac Hymer, Kyle Vickers & his team, or the original BLOX City ownership. This is an independent revival effort by fans, for fans.
          </div>
        </section>

        {/* Domain Notice */}
        <div className="bc-notice">
          <h3>📍 Official Domain</h3>
          <p>BLOX City officially owns and operates <strong>bloxcity.net</strong> — not bloxcity.com.</p>
        </div>

        {/* Social Links */}
        <section className="bc-social">
          <h3>Follow Our Progress</h3>
          <div className="bc-social-links">
            <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer" className="bc-social-link bc-discord">
              <svg viewBox="0 0 24 24" fill="currentColor" className="bc-social-icon">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord
            </a>
            <a href="https://x.com/bloxcitynet" target="_blank" rel="noopener noreferrer" className="bc-social-link bc-twitter">
              <svg viewBox="0 0 24 24" fill="currentColor" className="bc-social-icon">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X
            </a>
            <a href="https://upscrolled.com/" target="_blank" rel="noopener noreferrer" className="bc-social-link bc-upscrolled">
              <svg viewBox="0 0 24 24" fill="currentColor" className="bc-social-icon">
                <path d="M12 2L4 10h5v8h6v-8h5L12 2z"/>
              </svg>
              Upscrolled
            </a>
          </div>
        </section>

        {/* Original Notice */}
        <div className="bc-original">
          Looking for the original BLOX City? Check out{" "}
          <a href="https://brickplanet.com" target="_blank" rel="noopener noreferrer">brickplanet.com</a>
        </div>

        {/* Footer */}
        <footer className="bc-footer">
          <img src={bloxcityLogo} alt="BLOX City" className="bc-footer-logo" />
          <p>© 2026 BLOX City, Inc. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
