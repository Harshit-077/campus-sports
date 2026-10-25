import { useId, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** A labelled input with an error/hint line underneath. */
export function Field({ label, error, hint, className, ...rest }: FieldProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-note` : undefined}
        className={cn(
          "h-11 w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-muted/70",
          "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent",
          error ? "border-danger" : "border-line",
          className,
        )}
        {...rest}
      />
      {(error || hint) && (
        <p id={`${id}-note`} className={cn("text-xs", error ? "text-danger" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
