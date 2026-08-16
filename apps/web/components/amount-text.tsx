import { formatIDR } from "@/lib/format";

export const AmountText = ({ value, className }: { value: string; className?: string }): React.ReactElement => (
  <span className={className}>{formatIDR(value)}</span>
);
