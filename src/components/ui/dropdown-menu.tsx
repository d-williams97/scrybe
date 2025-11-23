"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownMenuContext =
  React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) {
    throw new Error(
      "DropdownMenu components must be used within a <DropdownMenu> root."
    );
  }
  return ctx;
}

interface DropdownMenuProps {
  children: React.ReactNode;
}

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
    }),
    [open]
  );

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  className?: string;
}

function DropdownMenuTrigger({
  children,
  className,
}: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdownMenuContext();

  return (
    <div
      className={cn("cursor-pointer", className)}
      onClick={() => setOpen(!open)}
    >
      {children}
    </div>
  );
}

interface DropdownMenuContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
}

function DropdownMenuContent({
  children,
  className,
  align = "start",
  ...props
}: DropdownMenuContentProps) {
  const { open } = useDropdownMenuContext();

  if (!open) return null;

  const alignmentClass =
    align === "end"
      ? "right-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "left-0";

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[180px] rounded-md border border-white/10 bg-background shadow-lg focus:outline-none",
        alignmentClass,
        className
      )}
      {...props}
    >
      <div className="py-1">{children}</div>
    </div>
  );
}

interface DropdownMenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function DropdownMenuItem({
  children,
  className,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenuContext();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    setOpen(false);
  };

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center px-3 py-2 text-sm text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
};
