import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";

const NewsletterUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link. Missing token.");
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await supabase.functions.invoke("newsletter-unsubscribe", {
          body: { token },
        });

        if (response.error) {
          throw new Error("Failed to unsubscribe");
        }

        const data = response.data as { success?: boolean; message?: string; error?: string };

        if (data.error) {
          setStatus("error");
          setMessage(data.error);
        } else {
          setStatus("success");
          setMessage(data.message || "Successfully unsubscribed!");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Failed to unsubscribe. Please try again.");
      }
    };

    unsubscribe();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto rounded-xl mb-4" />
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--bc-text))' }}>BLOX City</h1>
          </Link>
        </div>

        <div className="bc-card">
          <div className="bc-card-body text-center">
            {status === "loading" && (
              <div className="py-8">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--bc-primary))' }} />
                <p style={{ color: 'hsl(var(--bc-text-muted))' }}>Processing your request...</p>
              </div>
            )}

            {status === "success" && (
              <div className="py-8">
                <div className="bc-section-icon mx-auto mb-4" style={{ background: 'hsla(var(--bc-success), 0.1)' }}>
                  <CheckCircle className="w-8 h-8" style={{ color: 'hsl(var(--bc-success))' }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Unsubscribed</h2>
                <p className="mb-4" style={{ color: 'hsl(var(--bc-text-muted))' }}>{message}</p>
                <p className="text-sm mb-6" style={{ color: 'hsl(var(--bc-text-muted))' }}>
                  You will no longer receive newsletter emails from BLOX City.
                </p>
                <Link to="/" className="bc-btn bc-btn-info">
                  <ArrowLeft className="w-4 h-4" />
                  Back to BLOX City
                </Link>
              </div>
            )}

            {status === "error" && (
              <div className="py-8">
                <div className="bc-section-icon mx-auto mb-4" style={{ background: 'hsla(var(--bc-danger), 0.1)' }}>
                  <AlertCircle className="w-8 h-8" style={{ color: 'hsl(var(--bc-danger))' }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Error</h2>
                <p className="mb-6" style={{ color: 'hsl(var(--bc-text-muted))' }}>{message}</p>
                <Link to="/" className="bc-btn bc-btn-info">
                  <ArrowLeft className="w-4 h-4" />
                  Back to BLOX City
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>
            © 2026 BLOX City, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsletterUnsubscribe;
