import { Shield, Lock, FileCheck, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const TrustSection = () => {
  const certifications = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "FERPA Aligned",
      description: "Designed for student privacy compliance"
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "COPPA Ready",
      description: "Built with children's privacy in mind"
    },
    {
      icon: <FileCheck className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "Industry-standard security practices"
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Privacy First",
      description: "Data protection by design"
    }
  ];

  return (
    <section className="py-16 bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            Our Security Commitment
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Privacy & Security Built In From Day One
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We take student data privacy seriously. Our platform is designed with compliance and security as core priorities.
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
            All student data is encrypted in transit and at rest. We never sell or share student information. Working toward full FERPA, COPPA, and SOC 2 certification.
          </p>
        </div>
      </div>
    </section>
  );
};
