import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <Card className="border-dashed">
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">{description}</p>
    </CardContent>
  </Card>
);

export default EmptyState;
