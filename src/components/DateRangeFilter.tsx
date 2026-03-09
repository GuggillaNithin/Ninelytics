import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  value: number;
  onChange: (days: number) => void;
}

const options = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

const DateRangeFilter = ({ value, onChange }: DateRangeFilterProps) => (
  <div className="flex gap-1">
    {options.map((opt) => (
      <Button
        key={opt.value}
        variant={value === opt.value ? "default" : "outline"}
        size="sm"
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </Button>
    ))}
  </div>
);

export default DateRangeFilter;
