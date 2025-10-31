import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

export const TestimonialSection = () => {
  const testimonials = [
    {
      quote: "The AI-powered insights have completely transformed how I identify and support struggling readers. I now intervene weeks earlier than before.",
      author: "Sarah Mitchell",
      role: "3rd Grade Teacher",
      school: "Lincoln Elementary",
      initials: "SM"
    },
    {
      quote: "Finally, a platform that actually understands the science of reading. The cross-modal analysis is unlike anything I've seen in 15 years of teaching.",
      author: "James Rodriguez",
      role: "Reading Specialist",
      school: "Washington School District",
      initials: "JR"
    },
    {
      quote: "Our students are more engaged, and the data helps us prove what's working. The ML predictions have been remarkably accurate.",
      author: "Dr. Emily Chen",
      role: "Curriculum Director",
      school: "Metro Public Schools",
      initials: "EC"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by Educators Nationwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how teachers are using our AI-powered platform to accelerate student literacy
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-card transition-shadow duration-300">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary mb-4 opacity-50" />
                <p className="text-muted-foreground mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.school}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
