import { useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import bloxcityLogo from "@/assets/bloxcity.jpg";
import Header from "@/components/Header";

type ReservationStatus = 'pending' | 'approved' | 'denied' | null;

const CheckStatus = () => {
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
      if (response.error) { setCheckError("Failed to check status. Please try again."); setCheckLoading(false); return; }
      setStatusResult(response.data as any);
    } catch { setCheckError("Failed to check status. Please try again."); }
    setCheckLoading(false);
  };

  return (
    <div className="has-header">
      <Header />
      <div className="mx-auto max-w-lg px-6 py-16">
        <a href="/reserve" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Reserve
        </a>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <img src={bloxcityLogo} alt="BLOX City" className="mx-auto mb-4 h-14 w-14 rounded-xl" />
            <h1 className="text-2xl font-bold text-foreground">Check Reservation Status</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter your email to check if your username has been approved</p>
          </div>

          <form onSubmit={handleCheckStatus} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Email Address</label>
              <input type="email" value={checkEmail} onChange={(e) => setCheckEmail(e.target.value)} placeholder="Your email address" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" required disabled={checkLoading} />
            </div>
            <button type="submit" disabled={checkLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-50">
              <Search className="h-4 w-4" />
              {checkLoading ? "Checking..." : "Check Status"}
            </button>
          </form>

          {checkError && <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{checkError}</div>}

          {statusResult && (
            <div className={`mt-6 rounded-xl border p-5 ${
              !statusResult.found ? 'border-border bg-muted/50' :
              statusResult.status === 'pending' ? 'border-[hsl(var(--bc-yellow))]/30 bg-[hsl(var(--bc-yellow))]/5' :
              statusResult.status === 'approved' ? 'border-[hsl(var(--bc-green))]/30 bg-[hsl(var(--bc-green))]/5' :
              'border-destructive/30 bg-destructive/5'
            }`}>
              {!statusResult.found ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">No reservation found for this email.</p>
                  <a href="/reserve" className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary/80">Reserve a username →</a>
                </div>
              ) : statusResult.status === 'pending' ? (
                <div>
                  <p className="font-semibold text-[hsl(var(--bc-yellow))]">⏳ Pending Review</p>
                  <p className="mt-1 text-sm text-muted-foreground">Your username "<strong className="text-foreground">{statusResult.username}</strong>" is being reviewed.</p>
                </div>
              ) : statusResult.status === 'approved' ? (
                <div>
                  <p className="font-semibold text-[hsl(var(--bc-green))]">✅ Approved!</p>
                  <p className="mt-1 text-sm text-muted-foreground">Your username "<strong className="text-foreground">{statusResult.username}</strong>" has been approved! Check your email for your reservation code.</p>
                </div>
              ) : statusResult.status === 'denied' ? (
                <div>
                  <p className="font-semibold text-destructive">❌ Denied</p>
                  <p className="mt-1 text-sm text-muted-foreground">The username "<strong className="text-foreground">{statusResult.username}</strong>" was not approved.</p>
                  {statusResult.denialReason && <p className="mt-2 text-xs italic text-destructive">{statusResult.denialReason}</p>}
                  <a href="/reserve" className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">Reserve a Different Username</a>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckStatus;
