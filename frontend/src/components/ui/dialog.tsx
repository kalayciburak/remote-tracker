import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

const MODAL_BOUNCE_ANIMATION = "modal-bounce 460ms cubic-bezier(0.34, 1.56, 0.64, 1)";

function triggerBounce(el: HTMLElement | null) {
  if (!el) return;
  el.style.animation = "none";
  // force reflow so the animation restarts
  void el.offsetWidth;
  el.style.animation = MODAL_BOUNCE_ANIMATION;
}

function useMergedRef<T>(...refs: Array<React.Ref<T> | undefined>) {
  return React.useCallback(
    (value: T) => {
      for (const ref of refs) {
        if (typeof ref === "function") ref(value);
        else if (ref && "current" in ref) (ref as React.MutableRefObject<T | null>).current = value;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  );
}

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(
  (
    {
      className,
      children,
      onEscapeKeyDown,
      onPointerDownOutside,
      onInteractOutside,
      ...props
    },
    forwardedRef
  ) => {
    const localRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useMergedRef(forwardedRef as React.Ref<HTMLDivElement>, localRef);

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          onEscapeKeyDown={(event) => {
            onEscapeKeyDown?.(event);
            if (!event.defaultPrevented) {
              event.preventDefault();
              triggerBounce(localRef.current);
            }
          }}
          onPointerDownOutside={(event) => {
            onPointerDownOutside?.(event);
            if (!event.defaultPrevented) {
              event.preventDefault();
              triggerBounce(localRef.current);
            }
          }}
          onInteractOutside={(event) => {
            onInteractOutside?.(event);
            if (!event.defaultPrevented) {
              event.preventDefault();
              triggerBounce(localRef.current);
            }
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-auto",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            className
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Kapat</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex justify-end gap-2 pt-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
