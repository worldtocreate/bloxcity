import { Construction, Globe, Calendar, ArrowRight, Users } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="maintenance-container">
      <div className="maintenance-content">
        {/* Logo/Brand */}
        <div className="brand-section">
          <div className="logo-icon">
            <Construction className="w-16 h-16" />
          </div>
          <h1 className="brand-title">BLOX City</h1>
          <div className="brand-tagline">Est. March 2016</div>
        </div>

        {/* Main Message */}
        <div className="message-section">
          <h2 className="message-title">We're Coming Back</h2>
          <p className="message-text">
            The original BLOX City experience from March 2016 is returning in <strong>2026</strong>. 
            Our beloved website and client are being rebuilt from the ground up.
          </p>
        </div>

        {/* Username Reservation */}
        <div className="reservation-section">
          <h3>Reserve Your Username</h3>
          <p>Be first in line when we launch. Reserve your username now!</p>
          {!submitted ? (
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
              />
              <button type="submit" className="reservation-button">
                Reserve Username
              </button>
            </form>
          ) : (
            <div className="reservation-success">
              <span>✓</span> Username "<strong>{username}</strong>" has been reserved!
            </div>
          )}
        </div>

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

        {/* About the Team */}
        <div className="team-section">
          <div className="team-icon">
            <Users className="w-8 h-8" />
          </div>
          <h3>A Community Revival Project</h3>
          <p>
            BLOX City is being brought back by a dedicated team of <strong>4 developers</strong> who 
            share a passion for reviving this once-loved platform. We are building this project with 
            the vision to recreate the magic that made BLOX City special.
          </p>
          <div className="disclaimer">
            <strong>Disclaimer:</strong> This project is <em>not</em> associated with Isaac Hymer or the 
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

        {/* Social Links */}
        <div className="social-section">
          <h3>Follow Our Progress</h3>
          <div className="social-links">
            <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer" className="social-link discord">
              <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord
            </a>
            <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="social-link twitter">
              <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Follow on X
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="maintenance-footer">
          <p>© 2016 - 2026 BLOX City Revival Team. All rights reserved.</p>
          <p className="domain-badge">bloxcity.net</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
