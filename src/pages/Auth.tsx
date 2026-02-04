import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import bloxcityLogo from "@/assets/IMG_2412_Original-1.png";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/admin");
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/admin");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });
        if (error) throw error;
        setError("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto rounded-xl mb-4" />
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--bc-text))' }}>Admin Login</h1>
          <p style={{ color: 'hsl(var(--bc-text-muted))' }}>BLOX City Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="bc-card">
          <div className="bc-card-body space-y-4">
            {error && (
              <div className={`bc-alert ${error.includes("Check your email") ? "bc-alert-success" : "bc-alert-danger"} flex items-center gap-2`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bc-input"
                placeholder="admin@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bc-input"
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bc-btn bc-btn-info bc-btn-block"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Please wait...
                </>
              ) : (
                isSignUp ? "Sign Up" : "Sign In"
              )}
            </button>

            <p className="text-center text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>
              {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-medium hover:underline"
                style={{ color: 'hsl(var(--bc-primary))' }}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>

            <a 
              href="/" 
              className="block text-center text-sm hover:underline"
              style={{ color: 'hsl(var(--bc-text-muted))' }}
            >
              ← Back to home
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
