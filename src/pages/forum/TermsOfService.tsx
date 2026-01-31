import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  useEffect(() => {
    document.title = 'Terms of Service - BLOX City';
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <article className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--bc-text))] mb-6">Terms of Service</h1>
        <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-8">Last updated: January 31, 2026</p>

        <div className="prose prose-lg max-w-none text-[hsl(var(--bc-text))] space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">1. Acceptance of Terms</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              By accessing and using BLOX City ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">2. Eligibility</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              You must be at least 13 years of age to use BLOX City. By registering, you confirm that you meet 
              this age requirement. Users under 18 should have parental consent before using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">3. User Accounts</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              You are responsible for maintaining the confidentiality of your account credentials. You agree to:
            </p>
            <ul className="list-disc list-inside text-[hsl(var(--bc-text-muted))] mt-2 space-y-1">
              <li>Provide accurate and complete registration information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized account access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">4. Acceptable Use</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-[hsl(var(--bc-text-muted))] mt-2 space-y-1">
              <li>Post content that is illegal, harmful, threatening, abusive, or harassing</li>
              <li>Impersonate any person or entity</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Use the Service for any commercial purposes without authorization</li>
              <li>Upload malware or other harmful code</li>
              <li>Engage in any activity that disrupts the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">5. Content Ownership</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              You retain ownership of content you create. By posting content, you grant BLOX City a non-exclusive, 
              royalty-free license to use, display, and distribute your content within the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">6. Virtual Currency</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              BLOX City may offer virtual currency ("Coins") for use within the Service. Coins have no real-world 
              monetary value and cannot be exchanged for real currency. We reserve the right to modify virtual 
              currency systems at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">7. Termination</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              We reserve the right to suspend or terminate your account at any time for violations of these terms 
              or for any other reason at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">8. Disclaimer of Warranties</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              The Service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted 
              or error-free operation of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">9. Changes to Terms</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              We may update these terms at any time. Continued use of the Service after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">10. Contact</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              For questions about these Terms of Service, please contact us through the forum or support channels.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
