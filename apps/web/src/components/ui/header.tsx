import { cn } from "@/lib/utils";

export function TighterText({
  className,
  children,
  as = "span",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "p" | "span";
}) {
  const Component = as;
  return <Component className={cn("tracking-tighter", className)}>{children}</Component>;
}
