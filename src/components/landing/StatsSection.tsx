import { TrendingUp, Users, Award, Sparkles } from "lucide-react";

export const StatsSection = () => {
  const stats = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      value: "4 Novel",
      label: "AI Algorithms",
      description: "Proprietary ML technology"
    },
    {
      icon: <Users className="h-8 w-8" />,
      value: "Real-Time",
      label: "Predictions",
      description: "Identify at-risk students early"
    },
    {
      icon: <Award className="h-8 w-8" />,
      value: "Evidence",
      label: "Based Design",
      description: "Science of reading aligned"
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      value: "$7K+",
      label: "Monthly Savings",
      description: "vs traditional cloud AI"
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
