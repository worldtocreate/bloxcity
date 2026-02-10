import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="has-header">
      <Header />
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center">
          <p className="text-7xl font-extrabold text-primary">404</p>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Page not found</h1>
          <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
          <a href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
