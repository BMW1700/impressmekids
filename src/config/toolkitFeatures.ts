import { Trophy, Grid3X3, BarChart3, BookHeart } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface ToolkitFeature {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: "gamification" | "assessment" | "management" | "personal";
}

// These are the 5 à la carte toolkit features teachers can enable/disable
export const TOOLKIT_FEATURES: ToolkitFeature[] = [
  {
    id: "leaderboard",
    name: "Leaderboard",
    description: "Track student achievements and rankings",
    icon: Trophy,
    category: "gamification",
  },
  {
    id: "rubrics",
    name: "Rubrics",
    description: "Create and manage grading rubrics",
    icon: Grid3X3,
    category: "assessment",
  },
  {
    id: "ai-insights",
    name: "AI Insights",
    description: "Get AI-powered analytics on student performance",
    icon: BarChart3,
    category: "assessment",
  },
  {
    id: "behavior",
    name: "Behavior",
    description: "Track and reward student behavior",
    icon: Trophy,
    category: "management",
  },
  {
    id: "journal",
    name: "Journal",
    description: "Keep personal teaching notes and reflections",
    icon: BookHeart,
    category: "personal",
  },
];

// Group features by category for the sidebar
export const TOOLKIT_CATEGORIES = [
  { id: "gamification", name: "Gamification" },
  { id: "assessment", name: "Assessment" },
  { id: "management", name: "Classroom Management" },
  { id: "personal", name: "Personal" },
] as const;

export const getFeatureById = (id: string): ToolkitFeature | undefined => {
  return TOOLKIT_FEATURES.find((f) => f.id === id);
};
