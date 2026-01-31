import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

const ForumReserve = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalReservations, setTotalReservations] = useState<number | null>(null);

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

      if (response.error) {
        const anyError = response.error as any;
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
            // ignore
          }
        }

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
            <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Reserve Your Username</h1>
            <p className="text-[hsl(var(--bc-text-muted))] mt-2">Be first in line when we launch!</p>
          </div>

          {!submitted ? (
            <>
              <form onSubmit={handleReserve} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your desired username"
                    className="w-full px-4 py-3 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent outline-none text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))]"
                    minLength={3}
                    maxLength={20}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent outline-none text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))]"
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loading ? "Reserving..." : "Reserve Username"}
                </button>
              </form>

              {error && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${errorType === 'banned' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-red-50 text-red-700'}`}>
                  {error}
                </div>
              )}

              <Link to="/check-status" className="block mt-4 text-center text-[hsl(var(--bc-primary))] hover:underline text-sm">
                Already reserved? Check your status →
              </Link>
            </>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-[hsl(var(--bc-text))] mb-2">Fantastic!</h2>
              <p className="text-[hsl(var(--bc-text-muted))]">
                You have requested the username <strong className="text-[hsl(var(--bc-text))]">{username}</strong>. Our team is reviewing your reserved username.
              </p>
              <p className="text-[hsl(var(--bc-text-muted))] text-sm mt-2">
                If approved, your reservation code will be sent to your email address.
              </p>
              <Link to="/check-status" className="inline-block mt-4 text-[hsl(var(--bc-primary))] hover:underline font-medium">
                Check your reservation status →
              </Link>
            </div>
          )}

          {/* Reservation Counter */}
          {totalReservations !== null && totalReservations > 0 && (
            <div className="mt-6 text-center pt-6 border-t border-[hsl(var(--bc-border))]">
              <div className="text-3xl font-bold text-[hsl(var(--bc-primary))]">{totalReservations.toLocaleString()}</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">usernames reserved</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-[hsl(var(--bc-text-muted))]">
          © 2026 BLOX City, Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default ForumReserve;
