import * as React from "react";
import { cn } from "@/features/core/utils/utils";

/**
 * Input numérico "limpável": permite apagar o conteúdo (string vazia)
 * sem que o estado força "0" de volta. Mantém estado externo como número.
 */
export interface NumInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> {
  value: number;
  onValueChange: (n: number) => void;
  allowDecimal?: boolean;
}

export const NumInput = React.forwardRef<HTMLInputElement, NumInputProps>(
  ({ value, onValueChange, allowDecimal = true, className, placeholder = "0", ...rest }, ref) => {
    const [text, setText] = React.useState<string>(value ? String(value) : "");
    const lastEmittedRef = React.useRef<number>(value);

    React.useEffect(() => {
      if (value !== lastEmittedRef.current) {
        setText(value ? String(value) : "");
        lastEmittedRef.current = value;
      }
    }, [value]);

    return (
      <input
        ref={ref}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          let v = e.target.value.replace(",", ".");
          // Aceita apenas dígitos, ponto e sinal
          if (allowDecimal) v = v.replace(/[^0-9.-]/g, "");
          else v = v.replace(/[^0-9-]/g, "");
          setText(v);
          if (v === "" || v === "-" || v === ".") {
            lastEmittedRef.current = 0;
            onValueChange(0);
            return;
          }
          const n = Number(v);
          if (!Number.isNaN(n)) {
            lastEmittedRef.current = n;
            onValueChange(n);
          }
        }}
        onBlur={(e) => {
          const n = Number(text);
          if (Number.isFinite(n)) setText(n ? String(n) : "");
          else setText("");
          rest.onBlur?.(e);
        }}
        className={cn(
          "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm",
          className,
        )}
        style={{ fontSize: 16, ...(rest.style ?? {}) }}
        {...rest}
      />
    );
  },
);
NumInput.displayName = "NumInput";
