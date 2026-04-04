import { Link, useLocation } from "react-router-dom";
import { BarChart3, Upload } from "lucide-react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                Vision AI
              </h1>
            </div>
            <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
              <Link
                to="/"
                className={`px-2.5 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
                  location.pathname === "/"
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Upload className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-sm sm:text-base">Entrenamiento</span>
              </Link>
              <Link
                to="/resultados"
                className={`px-2.5 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
                  location.pathname === "/resultados"
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-sm sm:text-base">Resultados</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default Layout;
