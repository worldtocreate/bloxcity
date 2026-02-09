import { useState } from "react";
import { Menu, X } from "lucide-react";
import bloxcityLogo from "@/assets/bloxcity.jpg";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/reserve", label: "Reserve Username" },
    { href: "/faq", label: "FAQ" },
  ];

  return (
    <header className="site-header">
      <div className="header-container">
        <a href="/" className="header-brand">
          <img src={bloxcityLogo} alt="BLOX City" className="header-logo" />
          <span className="header-title">BLOX City</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="header-nav">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`header-nav-link ${window.location.pathname === link.href ? 'active' : ''}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="mobile-nav">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`mobile-nav-link ${window.location.pathname === link.href ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;
