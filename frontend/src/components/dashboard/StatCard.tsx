import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  className,
}: StatCardProps) => {
  return (
    <Card className={cn("overflow-hidden border-none shadow-md transition-all hover:shadow-xl hover:-translate-y-1", className)}>
      <CardContent className="flex items-center justify-between p-6">
        <div className="z-10">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground/70">{title}</p>
          <p className="mt-2 text-3xl font-black text-foreground drop-shadow-sm">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-2 text-xs font-bold px-2 py-1 rounded-full inline-block",
                trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
              )}
            >
              {trend.isPositive ? "↑" : "↓"}
              {trend.value}%
            </p>
          )}
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/50 shadow-inner backdrop-blur-sm group transition-transform">
          <Icon className="h-7 w-7 text-primary/80 group-hover:scale-110 transition-transform" />
        </div>
        {/* Background decoration */}
        <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl"></div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
