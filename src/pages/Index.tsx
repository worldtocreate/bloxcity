import { Construction, Globe, Calendar, ArrowRight } from "lucide-react";

const Index = () => {
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

        {/* Domain Notice */}
        <div className="domain-notice">
          <h3>Important Notice</h3>
          <p>
            BLOX City officially owns and operates <strong>bloxcity.net</strong> — not bloxcity.com. 
            This site will be the official home for BLOX City when we return. 
            Stay tuned for updates!
          </p>
        </div>

        {/* Footer */}
        <footer className="maintenance-footer">
          <p>© 2016 - 2026 BLOX City. All rights reserved.</p>
          <p className="domain-badge">bloxcity.net</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
