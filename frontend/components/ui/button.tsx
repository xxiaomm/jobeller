import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline";

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "bg-neutral-900 text-white hover:bg-neutral-700",
        variant === "outline" &&
          "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50",
        className,
      )}
      {...props}
    />
  );
}
