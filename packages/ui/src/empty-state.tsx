import { FileX2 } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "./cn";

export const EmptyState = ({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}): ReactNode => (
  <div className={cn("flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center", className)}>
    <FileX2 className="h-8 w-8 text-muted-foreground" />
    <p className="text-sm font-medium">{title}</p>
    {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    {action}
  </div>
);
