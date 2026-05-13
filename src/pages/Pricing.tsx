import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Building2, GraduationCap, Landmark } from "lucide-react";
import { Link } from "react-router-dom";

const tiers = [
  {
    name: "Pilot Program",
    icon: <GraduationCap className="h-6 w-6 text-primary" />,
    price: "Free",
    priceDetail: "Up to 30 students",
    description: "Perfect for evaluating NabuLearn before a district-wide rollout",
    features: [
      "Full AURA reading assessment",
      "RPG reading campaign",
      "5 educational games",
      "Teacher & student dashboards",
      "Basic analytics & reporting",
      "Email support",
    ],
    cta: "Start Pilot",
    ctaLink: "/auth",
    highlighted: false,
  },
  {
    name: "School",
    icon: <Building2 className="h-6 w-6 text-primary-foreground" />,
    price: "$5–7",
    priceDetail: "per student / year",
    description: "Complete platform for individual schools with full analytics and safety features",
    features: [
      "Everything in Pilot, plus:",
      "Unlimited students",
      "4 proprietary ML models",
      "SSVRS safety system",
      "Advanced AURA analytics",
      "Benchmark assessments",
      "Parent portal & notifications",
      "Priority support",
      "FERPA & COPPA aligned",
    ],
    cta: "Request a Quote",
    ctaLink: "/auth",
    highlighted: true,
  },
  {
    name: "District",
    icon: <Landmark className="h-6 w-6 text-primary" />,
    price: "Custom",
    priceDetail: "volume pricing",
    description: "Enterprise deployment with district-wide oversight, SSO, and dedicated support",
    features: [
      "Everything in School, plus:",
      "District manager dashboard",
      "Multi-school analytics",
      "Custom integrations",
      "Dedicated account manager",
      "Staff onboarding & training",
      "SLA & uptime guarantees",
      "Data export & compliance tools",
    ],
    cta: "Contact Sales",
    ctaLink: "/auth",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Pricing — NabuLearn AI Literacy Platform</title>
        <meta name="description" content="Simple per-student pricing for NabuLearn. Free pilot up to 30 students, school plans, and district-wide tiers from $5–7/student/year." />
        <link rel="canonical" href="https://nabulearn.com/pricing" />
        <meta property="og:title" content="NabuLearn Pricing — Pilot, School, District" />
        <meta property="og:description" content="$5–7/student/year. Free pilot up to 30 students. FERPA & COPPA aligned." />
        <meta property="og:url" content="https://nabulearn.com/pricing" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "NabuLearn AI Literacy Platform",
          "description": "AI-powered literacy platform for K-12 schools and districts. Reading fluency assessment, ML-based intervention, and an RPG reading adventure.",
          "brand": { "@type": "Organization", "name": "NabuLearn" },
          "offers": [
            { "@type": "Offer", "name": "Pilot Program", "price": "0", "priceCurrency": "USD", "description": "Free pilot for up to 30 students" },
            { "@type": "Offer", "name": "School", "price": "5", "priceCurrency": "USD", "description": "Per student per year, billed annually for a single school" },
            { "@type": "Offer", "name": "District", "price": "7", "priceCurrency": "USD", "description": "Per student per year, district-wide deployment with admin controls" }
          ]
        })}</script>
      </Helmet>
      <Header />

      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-2 bg-primary text-primary-foreground border-none">
              Simple, Transparent Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Pricing That Works for Your Budget
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Up to 60% less than DIBELS & mCLASS — with an LMS, safety system, and RPG campaign included
            </p>
            <div className="mt-6">
              <Button asChild variant="outline" size="sm">
                <Link to="/scope-and-sequence">
                  View Phonics Scope &amp; Sequence
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative flex flex-col transition-all duration-300 hover:scale-[1.02] ${
                  tier.highlighted
                    ? "border-2 border-primary shadow-lg"
                    : "border border-border"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`inline-flex p-3 rounded-full mx-auto mb-4 ${
                    tier.highlighted ? "bg-primary text-primary-foreground" : "bg-primary/10"
                  }`}>
                    {tier.icon}
                  </div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                    <p className="text-sm text-muted-foreground mt-1">{tier.priceDetail}</p>
                  </div>
                  <CardDescription className="mt-3">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full ${
                      tier.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    }`}
                    variant={tier.highlighted ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <Link to={tier.ctaLink}>
                      {tier.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Comparison callout */}
          <div className="bg-muted/50 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Why Schools Choose NabuLearn
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 mt-8">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">$5–7</div>
                <div className="text-sm text-muted-foreground">NabuLearn per student/year</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-muted-foreground mb-1">$10–15</div>
                <div className="text-sm text-muted-foreground">DIBELS / mCLASS per student/year</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">All-in-One</div>
                <div className="text-sm text-muted-foreground">Assessment + LMS + Safety + Games</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
