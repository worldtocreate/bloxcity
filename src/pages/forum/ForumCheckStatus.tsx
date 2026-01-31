import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";

type ReservationStatus = 'pending' | 'approved' | 'denied' | null;

const ForumCheckStatus = () => {
  const [checkEmail, setCheckEmail] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [statusResult, setStatusResult] = useState<{
    found: boolean;
    username?: string;
    status?: ReservationStatus;
    denialReason?: string;
  } | null>(null);

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEmail.trim()) return;

    setCheckLoading(true);
    setCheckError("");
    setStatusResult(null);

    try {
      const response = await supabase.functions.invoke('check-reservation-status', {
        body: { email: checkEmail.trim() },
      });

      if (response.error) {
        setCheckError("Failed to check status. Please try again.");
        setCheckLoading(false);
        return;
      }

      const data = response.data as any;
      setStatusResult(data);
    } catch (err) {
      setCheckError("Failed to check status. Please try again.");
    }

    setCheckLoading(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] mb-6 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Forum
        </Link>

        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto rounded-xl mb-4" />
            <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Check Reservation Status</h1>
            <p className="text-[hsl(var(--bc-text-muted))] mt-2">Enter your email to check if your username has been approved or denied.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleCheckStatus} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-1">Email Address</label>
              <input
                type="email"
                value={checkEmail}
                onChange={(e) => setCheckEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent outline-none text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))]"
                required
                disabled={checkLoading}
              />
            </div>
            <button
              type="submit"
              disabled={checkLoading}
              className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {checkLoading ? "Checking..." : "Check Status"}
            </button>
          </form>

          {/* Error */}
          {checkError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {checkError}
            </div>
          )}

          {/* Result */}
          {statusResult && (
            <div className={`mt-6 p-4 rounded-xl ${
              !statusResult.found ? 'bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))]' :
              statusResult.status === 'pending' ? 'bg-yellow-50 border border-yellow-300' :
              statusResult.status === 'approved' ? 'bg-green-50 border border-green-300' :
              'bg-red-50 border border-red-300'
            }`}>
              {!statusResult.found ? (
                <div className="text-center">
                  <p className="text-[hsl(var(--bc-text-muted))]">No reservation found for this email address.</p>
                  <Link to="/reserve" className="inline-block mt-3 text-[hsl(var(--bc-primary))] font-medium hover:underline">
                    Reserve a username →
                  </Link>
                </div>
              ) : statusResult.status === 'pending' ? (
                <div>
                  <p className="text-yellow-700 font-semibold text-lg mb-1">⏳ Pending Review</p>
                  <p className="text-gray-600">
                    Your username "<strong>{statusResult.username}</strong>" is currently being reviewed by our team.
                  </p>
                </div>
              ) : statusResult.status === 'approved' ? (
                <div>
                  <p className="text-green-700 font-semibold text-lg mb-1">✅ Approved!</p>
                  <p className="text-gray-600">
                    Your username "<strong>{statusResult.username}</strong>" has been approved! Check your email for your reservation code.
                  </p>
                </div>
              ) : statusResult.status === 'denied' ? (
                <div>
                  <p className="text-red-700 font-semibold text-lg mb-1">❌ Denied</p>
                  <p className="text-gray-600">
                    Unfortunately, the username "<strong>{statusResult.username}</strong>" was not approved.
                  </p>
                  {statusResult.denialReason && (
                    <p className="text-red-600 text-sm mt-2 italic">Reason: {statusResult.denialReason}</p>
                  )}
                  <Link to="/reserve" className="inline-block mt-3 bg-[hsl(var(--bc-primary))] text-white px-4 py-2 rounded-lg font-medium hover:bg-[hsl(var(--bc-primary-dark))] transition">
                    Reserve a Different Username
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          {/* Reserve link */}
          <div className="mt-6 text-center">
            <Link to="/reserve" className="text-[hsl(var(--bc-primary))] hover:underline text-sm">
              Don't have a reservation? Reserve now →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-[hsl(var(--bc-text-muted))]">
          © 2026 BLOX City, Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default ForumCheckStatus;
