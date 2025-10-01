import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Impress Me Kids. All rights reserved.
          </div>
          <div className="text-sm">
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
