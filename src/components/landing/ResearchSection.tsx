import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, LineChart, Network, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ResearchSection = () => {
  const innovations = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Cross-Modal Learning Network",
      description: "Analyzes phoneme production, prosody, and semantic understanding to predict reading outcomes with unprecedented accuracy",
      patent: "Proprietary Technology"
    },
    {
      icon: <LineChart className="h-8 w-8" />,
      title: "Adaptive Risk Scoring",
      description: "Real-time ML models identify at-risk students weeks before traditional assessments, enabling early intervention",
      patent: "Proprietary Technology"
    },
    {
      icon: <Network className="h-8 w-8" />,
      title: "Phoneme Transfer Learning",
      description: "Predicts which phonemes a student will master next based on articulatory relationships and cognitive load patterns",
      patent: "Proprietary Technology"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Next Best Action Engine",
      description: "Q-learning algorithm continuously optimizes instructional sequences for each individual learner",
      patent: "Proprietary Technology"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-2 bg-primary text-primary-foreground border-none">
            Revolutionary AI Technology
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            4 Proprietary Innovations Built In-House
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our ML platform doesn't just track progress—it predicts outcomes, identifies risks, and prescribes interventions with scientific precision
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-12">
          {innovations.map((innovation, index) => (
            <Card key={index} className="hover:shadow-purple transition-all duration-300 hover:scale-[1.02] border-2">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    {innovation.icon}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {innovation.patent}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{innovation.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{innovation.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-gradient-hero text-white rounded-2xl p-8 md:p-12 max-w-4xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Built on Cognitive Science & Validated by Research
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Our platform integrates decades of reading science research with cutting-edge machine learning to deliver outcomes that were previously impossible
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Badge variant="secondary" className="px-4 py-2">Adaptive Phoneme Progression</Badge>
            <Badge variant="secondary" className="px-4 py-2">Bloom's Taxonomy</Badge>
            <Badge variant="secondary" className="px-4 py-2">CMU Pronouncing Dictionary</Badge>
            <Badge variant="secondary" className="px-4 py-2">Q-Learning Reinforcement</Badge>
          </div>
        </div>
      </div>
    </section>
  );
};
