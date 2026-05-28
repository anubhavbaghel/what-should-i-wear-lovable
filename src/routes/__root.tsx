import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import { supabase } from "@/integrations/supabase/client";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <p className="display text-7xl text-foreground">404</p>
        <h2 className="mt-3 text-lg text-foreground">This page slipped out of the closet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find what you were looking for.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
        >
          Back home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <p className="display text-5xl text-foreground">oh no</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Something didn't load. Try again in a moment.
        </p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#FFF6F1" },
      { title: "What should i wear today?" },
      {
        name: "description",
        content:
          "Scan your clothes, dress a mannequin with AI try-on, and save your favorite looks.",
      },
      { property: "og:title", content: "What should i wear today?" },
      {
        property: "og:description",
        content:
          "Scan your clothes, dress a mannequin with AI try-on, and save your favorite looks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "What should i wear today?" },
      { name: "description", content: "Outfit Curator helps users digitally organize their wardrobe and create outfits." },
      { property: "og:description", content: "Outfit Curator helps users digitally organize their wardrobe and create outfits." },
      { name: "twitter:description", content: "Outfit Curator helps users digitally organize their wardrobe and create outfits." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f4f7e2e4-9838-4641-9082-fc0e5d0a4254/id-preview-ea854916--86f302ed-3ece-4b23-9fd1-6ec168d002c3.lovable.app-1779972549040.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f4f7e2e4-9838-4641-9082-fc0e5d0a4254/id-preview-ea854916--86f302ed-3ece-4b23-9fd1-6ec168d002c3.lovable.app-1779972549040.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

/** Invalidate router + query caches whenever auth state changes. */
function AuthSync() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);
  return null;
}
