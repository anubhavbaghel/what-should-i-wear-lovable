import { Link, useRouterState } from "@tanstack/react-router";
import { Shirt, Sparkles, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/closet", label: "Closet", icon: Shirt, tone: "pink" },
  { to: "/style", label: "Style", icon: Sparkles, tone: "sun" },
  { to: "/outfits", label: "Outfits", icon: Heart, tone: "mint" },
  { to: "/profile", label: "Profile", icon: User, tone: "paper" },
] as const;

export function BottomTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-3 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0px)]"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between gap-1 rounded-full border-[1.5px] border-ink bg-card p-1.5 shadow-[4px_4px_0_0_var(--ink)]">
        {tabs.map(({ to, label, icon: Icon, tone }) => {
          const active = pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-semibold transition-colors",
                  active ? "text-ink" : "text-muted-foreground hover:text-ink",
                )}
                style={
                  active
                    ? {
                        background:
                          tone === "pink"
                            ? "var(--pink)"
                            : tone === "sun"
                              ? "var(--sun)"
                              : tone === "mint"
                                ? "var(--mint)"
                                : "var(--paper)",
                      }
                    : undefined
                }
              >
                <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.4 : 1.8} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
