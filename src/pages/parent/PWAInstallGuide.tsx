import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Smartphone, Share, Plus, Bell, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PWAInstallGuide() {
  const navigate = useNavigate();

  const iosSteps = [
    {
      step: 1,
      title: "Open Safari",
      description: "Open NabuLearn in Safari browser (not Chrome or other browsers)",
      icon: "🧭",
    },
    {
      step: 2,
      title: "Tap the Share Button",
      description: "Tap the share icon at the bottom of the screen (square with arrow pointing up)",
      icon: "📤",
    },
    {
      step: 3,
      title: "Scroll Down & Tap 'Add to Home Screen'",
      description: "Scroll down in the share menu and tap 'Add to Home Screen'",
      icon: "➕",
    },
    {
      step: 4,
      title: "Name Your App & Tap 'Add'",
      description: "Keep the default name 'NabuLearn' and tap 'Add' in the top right",
      icon: "✅",
    },
    {
      step: 5,
      title: "Enable Notifications",
      description: "Open the app from your home screen and allow notifications when prompted",
      icon: "🔔",
    },
  ];

  const androidSteps = [
    {
      step: 1,
      title: "Open Chrome",
      description: "Open NabuLearn in Chrome browser",
      icon: "🌐",
    },
    {
      step: 2,
      title: "Tap the Menu",
      description: "Tap the three dots (⋮) in the top right corner",
      icon: "⋮",
    },
    {
      step: 3,
      title: "Tap 'Install app' or 'Add to Home screen'",
      description: "Look for 'Install app' or 'Add to Home screen' in the menu",
      icon: "📲",
    },
    {
      step: 4,
      title: "Confirm Installation",
      description: "Tap 'Install' to add the app to your home screen",
      icon: "✅",
    },
    {
      step: 5,
      title: "Enable Notifications",
      description: "Open the app and allow notifications when prompted",
      icon: "🔔",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Install NabuLearn</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Get instant push notifications for safety alerts, drill updates, and your child's check-in status by installing our app on your phone.
          </p>
        </div>

        {/* Benefits */}
        <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Why Install?
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Real-time Alerts</p>
                <p className="text-xs text-muted-foreground">Instant notifications during emergencies</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Check-in Updates</p>
                <p className="text-xs text-muted-foreground">Know when your child is marked safe</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Works Offline</p>
                <p className="text-xs text-muted-foreground">Access key features without internet</p>
              </div>
            </div>
          </div>
        </Card>

        {/* iOS Instructions */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white text-xl">
              
            </div>
            <div>
              <h2 className="font-semibold text-lg">iPhone / iPad</h2>
              <p className="text-sm text-muted-foreground">iOS 16.4 or later required for notifications</p>
            </div>
          </div>

          <div className="space-y-4">
            {iosSteps.map((step) => (
              <div key={step.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {step.step}
                </div>
                <div className="flex-1 pb-4 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{step.icon}</span>
                    <h3 className="font-medium">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> You must use Safari browser on iPhone. Other browsers like Chrome don't support installing web apps on iOS.
            </p>
          </div>
        </Card>

        {/* Android Instructions */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xl">
              🤖
            </div>
            <div>
              <h2 className="font-semibold text-lg">Android</h2>
              <p className="text-sm text-muted-foreground">Works with Chrome, Edge, and Samsung Internet</p>
            </div>
          </div>

          <div className="space-y-4">
            {androidSteps.map((step) => (
              <div key={step.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {step.step}
                </div>
                <div className="flex-1 pb-4 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{step.icon}</span>
                    <h3 className="font-medium">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Troubleshooting */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Troubleshooting</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Not seeing the install option?</p>
              <p className="text-muted-foreground">Make sure you're using Safari on iPhone or Chrome on Android. The install option won't appear in other browsers.</p>
            </div>
            <div>
              <p className="font-medium">Not receiving notifications on iPhone?</p>
              <p className="text-muted-foreground">iOS 16.4 or later is required. Go to Settings → Notifications → NabuLearn and make sure notifications are enabled.</p>
            </div>
            <div>
              <p className="font-medium">Still having issues?</p>
              <p className="text-muted-foreground">Don't worry! You'll also receive important safety alerts via email as a backup.</p>
            </div>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
