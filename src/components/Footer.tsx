import { Link } from "react-router-dom";
import { Shield, Globe, FileText, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();
  return <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Trust Badges Section */}
        <div className="mb-6 pb-6 border-b border-border">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Privacy-First Platform</span>
              <span className="text-muted-foreground/60">•</span>
              <span className="font-medium text-primary">4 Proprietary ML Algorithms</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="outline" className="px-3 py-1.5 border-primary/20 hover:border-primary/40 transition-colors">
                <Globe className="h-3.5 w-3.5 mr-1.5 text-primary" />
                FERPA Aligned
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 border-primary/20 hover:border-primary/40 transition-colors">
                <Shield className="h-3.5 w-3.5 mr-1.5 text-primary" />
                COPPA Ready
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 border-primary/20 hover:border-primary/40 transition-colors">
                <FileText className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Enterprise Security
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 border-primary/20 hover:border-primary/40 transition-colors">
                <Globe className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Privacy First
              </Badge>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} YubiLearn. {t('footer.copyright').replace('© {year} YubiLearn. ', '')}
            <span className="block text-xs">
              Sir Bookears™ is a trademark of YubiLearn. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/scope-and-sequence" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              Scope &amp; Sequence
            </Link>
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
              {t('footer.privacyPolicy')}
            </Link>
            <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">
              {t('footer.termsOfService')}
            </Link>
            <span className="text-primary font-medium">
              Powered by YubiLearn ✨
            </span>
          </div>
        </div>
      </div>
    </footer>;
};