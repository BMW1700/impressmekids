import { createContext, useContext, useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  action?: () => void; // e.g. navigate to a tab
}

interface TourContextType {
  steps: TourStep[];
  currentStep: number;
  activeStepId: string | null;
  isActive: boolean;
  next: () => void;
  prev: () => void;
  goToStep: (index: number) => void;
  startTour: () => void;
  endTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export const useTour = () => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be inside DemoTourProvider");
  return ctx;
};

export const DemoTourProvider = ({ steps, children, onStepChange }: { steps: TourStep[]; children: ReactNode; onStepChange?: (step: TourStep) => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const goToStep = (index: number) => {
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    setCurrentStep(clamped);
    const step = steps[clamped];
    step?.action?.();
    onStepChange?.(step);
  };

  const next = () => {
    if (currentStep < steps.length - 1) goToStep(currentStep + 1);
    else endTour();
  };
  const prev = () => { if (currentStep > 0) goToStep(currentStep - 1); };
  const startTour = () => { setIsActive(true); goToStep(0); };
  const endTour = () => setIsActive(false);

  return (
    <TourContext.Provider value={{ steps, currentStep, activeStepId: isActive ? steps[currentStep]?.id ?? null : null, isActive, next, prev, goToStep, startTour, endTour }}>
      {children}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none"
          >
            <div className="max-w-2xl mx-auto pointer-events-auto">
              <div className="bg-card/95 backdrop-blur-xl border-2 border-primary/30 rounded-2xl shadow-2xl p-3 sm:p-5">
                <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs sm:text-sm font-bold flex-shrink-0">
                      {currentStep + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground text-sm sm:text-base truncate">{steps[currentStep]?.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{steps[currentStep]?.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={endTour} className="flex-shrink-0 text-muted-foreground hover:text-foreground p-1 h-auto">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1 sm:gap-1.5 flex-wrap max-w-[40%] sm:max-w-none overflow-hidden">
                    {steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToStep(i)}
                        className={cn(
                          "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all",
                          i === currentStep ? "bg-primary w-4 sm:w-6" : i < currentStep ? "bg-primary/50" : "bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={prev} disabled={currentStep === 0} className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                      <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" /> Back
                    </Button>
                    <Button size="sm" onClick={next} className="bg-primary text-primary-foreground h-8 px-2 sm:px-3 text-xs sm:text-sm">
                      {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isActive && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Button onClick={startTour} className="bg-primary text-primary-foreground shadow-lg gap-2 rounded-full px-6 py-3 h-auto hover:scale-105 transition-transform">
            <MapPin className="h-4 w-4" /> Start Guided Tour
          </Button>
        </div>
      )}
    </TourContext.Provider>
  );
};
