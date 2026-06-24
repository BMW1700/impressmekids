import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Sparkles, Crown, Users } from "lucide-react";
import { Link } from "react-router-dom";

const tiers = [
  {
    name: "Free",
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    price: "$0",
    priceDetail: "forever",
    description: "Start playing today — no credit card needed.",
    features: [
      "Pre-K Benny adventures (Level 1)",
      "K–12 LexiQuest RPG (first world)",
      "Daily reading streaks & rewards",
      "Basic progress tracking",
      "Up to 1 reader profile",
    ],
    cta: "Start playing",
    ctaLink: "/auth",
    highlighted: false,
  },
  {
    name: "Pro Reader",
    icon: <Crown className="h-6 w-6 text-primary-foreground" />,
    price: "$9.99",
    priceDetail: "per month",
    description: "The full adventure — every world, every story, every hero.",
    features: [
      "Everything in Free, plus:",
      "All Benny worlds & episodes",
      "All LexiQuest campaigns & boss battles",
      "All 13 heroes + character skins",
      "Custom story generator (parent-authored)",
      "Detailed reading analytics & phoneme heatmap",
      "Castle Swarm Defense (full game)",
      "Priority support",
    ],
    cta: "Go Pro",
    ctaLink: "/auth",
    highlighted: true,
  },
  {
    name: "Family",
    icon: <Users className="h-6 w-6 text-primary" />,
    price: "$14.99",
    priceDetail: "per month",
    description: "One plan for up to 4 readers in your household.",
    features: [
      "Everything in Pro Reader, plus:",
      "Up to 4 reader profiles",
      "Per-child progress dashboards",
      "Parent portal with weekly summaries",
      "Shared streaks & family leaderboard",
      "Cross-device sync (iPad, Chromebook, phone)",
    ],
    cta: "Start Family Plan",
    ctaLink: "/auth",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Pricing — NabuLearn</title>
        <meta name="description" content="Simple plans for families. Free forever to start, with Pro and Family upgrades that unlock every world, hero, and story in NabuLearn." />
        <link rel="canonical" href="https://nabulearn.com/pricing" />
        <meta property="og:title" content="NabuLearn Pricing — Free, Pro, Family" />
        <meta property="og:description" content="Free forever to start. Pro Reader and Family plans unlock the full reading adventure." />
        <meta property="og:url" content="https://nabulearn.com/pricing" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "NabuLearn",
          "description": "AI-powered reading adventure for kids ages 2–18. Pre-K Benny stories and a K-12 literacy RPG.",
          "brand": { "@type": "Organization", "name": "NabuLearn" },
          "offers": [
            { "@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "USD" },
            { "@type": "Offer", "name": "Pro Reader", "price": "9.99", "priceCurrency": "USD" },
            { "@type": "Offer", "name": "Family", "price": "14.99", "priceCurrency": "USD" }
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
              Reading adventures for every family
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free. Upgrade any time. Cancel any time.
            </p>
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

          {/* Family-friendly trust strip */}
          <div className="bg-muted/50 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Built for kids. Loved by parents.
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 mt-8">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">Ages 2–18</div>
                <div className="text-sm text-muted-foreground">Pre-K Benny stories through K-12 RPG</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">No ads</div>
                <div className="text-sm text-muted-foreground">Ever. On any plan.</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">COPPA</div>
                <div className="text-sm text-muted-foreground">Privacy-first, parental consent built in</div>
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
