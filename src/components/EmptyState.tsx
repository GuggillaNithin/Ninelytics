import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

const EmptyState = ({ title, description, icon: Icon, action }: EmptyStateProps) => (
  <Card className="border-dashed">
    <CardHeader className="items-center text-center">
      {Icon && <Icon className="h-10 w-10 text-muted-foreground mb-2" />}
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent className="text-center space-y-4">
      <p className="text-muted-foreground text-sm">{description}</p>
      {action}
    </CardContent>
  </Card>
);

export default EmptyState;
