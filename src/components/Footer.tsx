import { Link } from "react-router-dom";
import { Shield, Lock, FileCheck, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Trust Badges Section */}
        <div className="mb-6 pb-6 border-b border-border">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Trusted by 20+ Schools</span>
              <span className="text-muted-foreground/60">•</span>
              <span className="font-medium text-primary">4 Patent-Pending ML Algorithms</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="outline" className="px-3 py-1.5 border-primary/20 hover:border-primary/40 transition-colors">
                <FileCheck className="h-3.5 w-3.5 mr-1.5 text-primary" />
                FERPA Compliant
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 border-primary/20 hover:border-primary/40 transition-colors">
                <Shield className="h-3.5 w-3.5 mr-1.5 text-primary" />
                COPPA Compliant
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 border-primary/20 hover:border-primary/40 transition-colors">
                <Lock className="h-3.5 w-3.5 mr-1.5 text-primary" />
                SOC 2 Type II
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 border-primary/20 hover:border-primary/40 transition-colors">
                <Globe className="h-3.5 w-3.5 mr-1.5 text-primary" />
                GDPR Ready
              </Badge>
            </div>
          </div>
        </div>

        {/* Footer Links */}
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
            <a 
              href="https://impressme.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark transition-colors font-medium"
            >
              An Impress Me Family App ✨
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
