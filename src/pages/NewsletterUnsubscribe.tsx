import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import bloxcityLogo from "@/assets/bloxcity.jpg";

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
    <div className="maintenance-container">
      <div className="maintenance-content" style={{ maxWidth: "500px" }}>
        <div className="brand-section">
          <div className="logo-icon">
            <img src={bloxcityLogo} alt="BLOX City Logo" />
          </div>
          <h1 className="brand-title">BLOX City</h1>
        </div>

        <div className="reservation-section">
          {status === "loading" && (
            <div className="text-center">
              <p className="text-gray-400">Processing your request...</p>
            </div>
          )}

          {status === "success" && (
            <div className="reservation-success">
              <div className="success-header">
                <span>✅</span> Unsubscribed
              </div>
              <p className="success-message">{message}</p>
              <p className="success-note">
                You will no longer receive newsletter emails from BLOX City.
              </p>
              <a href="/" className="check-status-link">
                ← Back to BLOX City
              </a>
            </div>
          )}

          {status === "error" && (
            <div className="reservation-error" style={{ padding: "20px", borderRadius: "8px" }}>
              <p style={{ marginBottom: "10px" }}>{message}</p>
              <a href="/" className="check-status-link">
                ← Back to BLOX City
              </a>
            </div>
          )}
        </div>

        <footer className="maintenance-footer">
          <p>© 2026 BLOX City, Inc. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default NewsletterUnsubscribe;
