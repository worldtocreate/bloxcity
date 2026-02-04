import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[hsla(var(--bc-primary),0.1)] flex items-center justify-center">
            <span className="text-4xl">🔍</span>
          </div>
          <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">
            Error 404: Page Not Found
          </h1>
          <p className="text-[hsl(var(--bc-text-muted))] mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition font-medium"
          >
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;