import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Search, ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
      <div className="w-full max-w-lg">
        <div className="bc-card">
          <div className="bc-card-body text-center py-12">
            <div className="bc-section-icon mx-auto mb-6" style={{ width: '5rem', height: '5rem' }}>
              <Search className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>
              Error 404
            </h1>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'hsl(var(--bc-text))' }}>
              Page Not Found
            </h2>
            <p className="mb-8" style={{ color: 'hsl(var(--bc-text-muted))' }}>
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="bc-btn bc-btn-secondary"
              >
                <ArrowLeft className="w-4 h-4" />
                Go back
              </button>
              <Link
                to="/"
                className="bc-btn bc-btn-info"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
