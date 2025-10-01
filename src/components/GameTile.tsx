import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Gamepad2 } from "lucide-react";

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
            Coming Soon
          </Button>
        ) : (
          <Button asChild className="w-full bg-gradient-primary hover:opacity-90">
            <Link to={path}>Play Now</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
