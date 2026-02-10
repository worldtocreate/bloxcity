import { useState, useEffect } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";
import bloxcityLogo from "@/assets/bloxcity.jpg";
import Header from "@/components/Header";
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
      if (!error && data !== null) setTotalReservations(data);
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
            if (payload?.error) { setError(payload.error); setErrorType(payload.errorType || null); setLoading(false); return; }
          } catch {}
        }
        const contextPayload = anyError?.context as { error?: string; errorType?: string } | undefined;
        if (contextPayload?.error) { setError(contextPayload.error); setErrorType(contextPayload.errorType || null); setLoading(false); return; }
        setError(anyError?.message || "Failed to reserve username. Please try again.");
        setLoading(false);
        return;
      }
      const data = response.data as any;
      if (data.error) { setError(data.error); setErrorType(data.errorType || null); setLoading(false); return; }
      setSubmitted(true);
    } catch { setError("Failed to reserve username. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="has-header">
      <Header />
      <div className="mx-auto max-w-lg px-6 py-16">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </a>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <UserPlus className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Reserve Your Username</h1>
            <p className="mt-2 text-sm text-muted-foreground">Be first in line when BLOX City launches in 2026</p>
          </div>

          {!submitted ? (
            <>
              <form onSubmit={handleReserve} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your desired username" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" minLength={3} maxLength={20} required disabled={loading} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" required disabled={loading} />
                </div>
                <button type="submit" className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-50" disabled={loading}>
                  {loading ? "Reserving..." : "Reserve Username"}
                </button>
              </form>
              {error && (
                <div className={`mt-4 rounded-lg p-3 text-sm ${errorType === 'banned' ? 'border-2 border-destructive/50 bg-destructive/10 font-semibold text-destructive' : 'border border-destructive/20 bg-destructive/5 text-destructive'}`}>
                  {error}
                </div>
              )}
              <a href="/reserve/check-status" className="mt-4 block text-center text-sm font-medium text-primary transition hover:text-primary/80">
                Already reserved? Check your status →
              </a>
            </>
          ) : (
            <div className="rounded-xl border border-[hsl(var(--bc-green))]/30 bg-[hsl(var(--bc-green))]/5 p-6 text-center">
              <p className="text-lg font-semibold text-[hsl(var(--bc-green))]">🎉 Fantastic!</p>
              <p className="mt-2 text-sm text-muted-foreground">
                You have requested <strong className="text-foreground">{username}</strong>. Our team is reviewing your reservation.
              </p>
              <p className="mt-1 text-xs text-muted-foreground italic">If approved, your reservation code will be sent to your email.</p>
              <a href="/reserve/check-status" className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80">
                Check your reservation status →
              </a>
            </div>
          )}
        </div>

        {totalReservations !== null && totalReservations > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-primary/5 p-6 text-center">
            <p className="text-3xl font-extrabold text-primary">{totalReservations.toLocaleString()}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">usernames reserved</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reserve;
