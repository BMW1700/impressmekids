import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface GameTileProps {
  title: string;
  description: string;
  gradeRange: string;
  path: string;
  icon?: React.ReactNode;
  isComingSoon?: boolean;
}

export const GameTile = ({ 
  title, 
  description, 
  gradeRange, 
  path, 
  icon,
  isComingSoon = false 
}: GameTileProps) => {
  const { t } = useLanguage();

  return (
    <Card className="shadow-card hover:shadow-purple transition-all duration-300 hover:scale-105">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-primary">
            {icon || <Gamepad2 className="h-6 w-6 text-white" />}
          </div>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            {gradeRange}
          </Badge>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        {isComingSoon ? (
          <Button disabled className="w-full" variant="outline">
            {t('games.comingSoon')}
          </Button>
        ) : (
          <Button asChild className="w-full bg-gradient-primary hover:opacity-90">
            <Link to={path}>{t('games.playNow')}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
