import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children?: ReactNode;
}

const DashboardHeader = ({ title, subtitle, icon, onRefresh, isRefreshing, children }: DashboardHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {children}
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      )}
    </div>
  </div>
);

export default DashboardHeader;
