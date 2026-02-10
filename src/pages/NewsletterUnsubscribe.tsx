import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MailX, Loader2, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";

const NewsletterUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); setMessage("Invalid unsubscribe link. Missing token."); return; }
    const unsubscribe = async () => {
      try {
        const response = await supabase.functions.invoke("newsletter-unsubscribe", { body: { token } });
        if (response.error) throw new Error("Failed to unsubscribe");
        const data = response.data as { success?: boolean; message?: string; error?: string };
        if (data.error) { setStatus("error"); setMessage(data.error); }
        else { setStatus("success"); setMessage(data.message || "Successfully unsubscribed!"); }
      } catch { setStatus("error"); setMessage("Failed to unsubscribe. Please try again."); }
    };
    unsubscribe();
  }, [searchParams]);

  return (
    <div className="has-header">
      <Header />
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Processing your request...</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--bc-green))] text-white">
                <MailX className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Unsubscribed</h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <p className="mt-1 text-xs text-muted-foreground">You will no longer receive newsletter emails from BLOX City.</p>
              <a href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
                <ArrowLeft className="h-4 w-4" /> Back to BLOX City
              </a>
            </>
          )}
          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
                <MailX className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
              <p className="mt-2 text-sm text-destructive">{message}</p>
              <a href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
                <ArrowLeft className="h-4 w-4" /> Back to BLOX City
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterUnsubscribe;
