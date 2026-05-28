import { Link, useRouterState } from "@tanstack/react-router";
import { Shirt, Sparkles, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/closet", label: "Closet", icon: Shirt },
  { to: "/style", label: "Style", icon: Sparkles },
  { to: "/outfits", label: "Outfits", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md pb-[max(env(safe-area-inset-bottom),0px)]"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2 : 1.5} />
                <span className={cn(active && "underline-accent")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
