import { useState } from "react";
import { Input } from "@/components/ui/input";

interface FormattedNumberInputProps {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  min?: number;
  placeholder?: string;
}

const fmt = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });

const FormattedNumberInput = ({
  value,
  onChange,
  className,
  min = 0,
  placeholder,
}: FormattedNumberInputProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <Input
      type="text"
      inputMode="numeric"
      className={className}
      value={focused ? (value || "") : (value > 0 ? fmt.format(value) : "")}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.]/g, "");
        const n = parseFloat(raw);
        onChange(isNaN(n) ? 0 : Math.max(min, n));
      }}
    />
  );
};

export default FormattedNumberInput;
