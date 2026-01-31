import { useState, useEffect } from "react";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";
import { supabase } from "@/integrations/supabase/client";

const Reserve = () => {
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
    <div className="maintenance-container">
      <div className="maintenance-content">
        {/* Logo/Brand */}
        <div className="brand-section">
          <a href="/" className="logo-icon">
            <img src={bloxcityLogo} alt="BLOX City Logo" />
          </a>
          <h1 className="brand-title">Reserve Your Username</h1>
          <div className="brand-tagline">Be first in line when we launch</div>
        </div>

        {/* Username Reservation */}
        <div className="reservation-section">
          <h3>Claim Your Spot</h3>
          <p>Reserve your username now and be ready for the BLOX City revival in 2026!</p>
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

        {/* Back to Home */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a href="/" className="check-status-link">
            ← Back to Home
          </a>
        </div>

        {/* Footer */}
        <footer className="maintenance-footer">
          <p>© 2026 BLOX City, Inc. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Reserve;
