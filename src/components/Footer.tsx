import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Impress Me Kids. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link 
              to="https://impressme.com" 
              target="_blank"
              className="text-primary hover:text-primary-dark transition-colors"
            >
              An Impress Me Family App ✨
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
