import { Shield, Lock, FileCheck, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const TrustSection = () => {
  const certifications = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "FERPA Compliant",
      description: "Full compliance with student privacy regulations"
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "COPPA Certified",
      description: "Protecting children's online privacy"
    },
    {
      icon: <FileCheck className="h-6 w-6" />,
      title: "SOC 2 Type II",
      description: "Enterprise-grade security standards"
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "GDPR Ready",
      description: "International data protection compliance"
    }
  ];

  return (
    <section className="py-16 bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            Security & Compliance
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Enterprise-Grade Security You Can Trust
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We take student data privacy seriously. Our platform meets the highest security standards.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {certifications.map((cert, index) => (
            <div 
              key={index}
              className="text-center p-6 rounded-lg bg-card border border-border hover:border-primary transition-colors"
            >
              <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
                {cert.icon}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{cert.title}</h3>
              <p className="text-sm text-muted-foreground">{cert.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All student data is encrypted in transit and at rest. We never sell or share student information.
          </p>
        </div>
      </div>
    </section>
  );
};
