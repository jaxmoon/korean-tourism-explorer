import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      icon,
      type = "text",
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const autoId = React.useId();
    const sanitizedLabel = label
      ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : undefined;
    const inputId = id || sanitizedLabel || autoId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;

    return (
      <div className="flex w-full flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            className={cn(
              "w-full rounded-lg border px-4 py-3 text-base text-gray-900 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
              error
                ? "border-error focus:ring-error focus:border-error"
                : "border-gray-300",
              icon && "pl-10",
              className,
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperId}
            {...props}
          />
        </div>

        {error && (
          <p id={errorId} className="text-sm text-error">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-sm text-gray-600">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

