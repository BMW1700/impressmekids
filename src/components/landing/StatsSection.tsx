import { DollarSign, Brain, Gamepad2, ShieldCheck } from "lucide-react";

export const StatsSection = () => {
  const stats = [
    {
      icon: <DollarSign className="h-8 w-8" />,
      value: "$0/Student",
      label: "Reading Assessments",
      description: "vs $10–15/student with DIBELS & mCLASS"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      value: "4",
      label: "Proprietary ML Models",
      description: "Built in-house, not available anywhere else"
    },
    {
      icon: <Gamepad2 className="h-8 w-8" />,
      value: "5 Games +",
      label: "RPG Campaign",
      description: "Students learn through play & adventure"
    },
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      value: "538+",
      label: "Security Policies",
      description: "Enterprise-grade data protection"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center p-6 rounded-lg bg-card hover:shadow-card transition-all duration-300 hover:scale-105"
            >
              <div className="inline-flex p-3 rounded-full bg-gradient-primary mb-4 text-white">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm font-semibold text-foreground mb-2">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
