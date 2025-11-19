import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium",
    "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary-500 text-white shadow-sm hover:bg-primary-600 active:bg-primary-700",
        secondary:
          "bg-gray-100 text-gray-800 shadow-sm hover:bg-gray-200 active:bg-gray-300",
        outline:
          "border border-primary-500 text-primary-600 hover:bg-primary-50 active:bg-primary-100",
        ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
        danger:
          "bg-error text-white shadow-sm hover:bg-[#d63a2e] active:bg-[#b82f25]",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      iconPosition = "left",
      fullWidth,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const showLeftIcon = icon && iconPosition === "left" && !loading;
    const showRightIcon = icon && iconPosition === "right" && !loading;

    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          className,
        )}
        disabled={isDisabled}
        aria-busy={loading}
        aria-live="polite"
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin text-current"
            viewBox="0 0 24 24"
            role="status"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {showLeftIcon && <span className="mr-2 text-inherit">{icon}</span>}
        <span>{children}</span>
        {showRightIcon && <span className="ml-2 text-inherit">{icon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
