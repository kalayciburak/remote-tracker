import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        groupA: "border-transparent bg-groupA-bg text-groupA",
        groupB: "border-transparent bg-groupB-bg text-groupB",
        admin: "border-transparent bg-amber-100 text-amber-900",
        user: "border-transparent bg-secondary text-secondary-foreground",
        remote: "border-remote-line bg-remote-bg text-remote-fg",
        office: "border-office-line bg-office-bg text-office-fg",
        deploy: "border-deploy-line bg-deploy-bg text-deploy-fg",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
