import { X, ChevronRight } from "lucide-react";

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
};

export function FilterSelect({ label, value, onChange, options, placeholder }: FilterSelectProps) {
  const isActive = !!value;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between min-h-[18px]">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        {isActive && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary hover:text-primary/80 cursor-pointer transition-colors"
          >
            <X className="h-2.5 w-2.5" /> Limpar
          </button>
        )}
      </div>
      <div
        className={`relative rounded-xl border transition-all ${isActive ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
      >
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-xl bg-background px-3.5 text-xs outline-none cursor-pointer font-medium appearance-none"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronRight
          className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rotate-90 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>
    </div>
  );
}

type FilterDateProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
};

export function FilterDate({ label, value, onChange }: FilterDateProps) {
  const isActive = !!value;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between min-h-[18px]">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        {isActive && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary hover:text-primary/80 cursor-pointer transition-colors"
          >
            <X className="h-2.5 w-2.5" /> Limpar
          </button>
        )}
      </div>
      <div
        className={`relative rounded-xl border transition-all ${isActive ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
      >
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-xl bg-background px-3.5 text-xs outline-none cursor-pointer font-medium"
        />
      </div>
    </div>
  );
}
