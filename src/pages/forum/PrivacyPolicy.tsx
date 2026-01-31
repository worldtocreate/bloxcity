import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy - BLOX City';
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
        <h1 className="text-3xl font-bold text-[hsl(var(--bc-text))] mb-6">Privacy Policy</h1>
        <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-8">Last updated: January 31, 2026</p>

        <div className="prose prose-lg max-w-none text-[hsl(var(--bc-text))] space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">1. Information We Collect</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-[hsl(var(--bc-text-muted))] mt-2 space-y-1">
              <li>Account information (username, email address, password, date of birth)</li>
              <li>Profile information (avatar, bio, social links)</li>
              <li>Content you create (posts, messages, comments)</li>
              <li>Communications with us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">2. Automatically Collected Information</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              When you use BLOX City, we automatically collect:
            </p>
            <ul className="list-disc list-inside text-[hsl(var(--bc-text-muted))] mt-2 space-y-1">
              <li>Device information (browser type, operating system)</li>
              <li>Log data (IP address, access times, pages viewed)</li>
              <li>Usage information (features used, interactions)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">3. How We Use Your Information</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-[hsl(var(--bc-text-muted))] mt-2 space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
              <li>Detect, investigate, and prevent fraudulent or unauthorized activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">4. Information Sharing</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              We do not sell your personal information. We may share information:
            </p>
            <ul className="list-disc list-inside text-[hsl(var(--bc-text-muted))] mt-2 space-y-1">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist our operations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">5. Data Security</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              We implement appropriate security measures to protect your information. However, no method of 
              transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">6. Your Rights</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-[hsl(var(--bc-text-muted))] mt-2 space-y-1">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of promotional communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">7. Children's Privacy</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              BLOX City is not intended for children under 13. We do not knowingly collect personal information 
              from children under 13. If we learn we have collected such information, we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">8. Cookies</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              We use cookies and similar technologies to maintain your session, remember your preferences, 
              and analyze how you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">9. Changes to This Policy</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">10. Contact Us</h2>
            <p className="text-[hsl(var(--bc-text-muted))]">
              If you have any questions about this Privacy Policy, please contact us through the forum or 
              support channels.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
