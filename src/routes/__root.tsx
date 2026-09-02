import { useEffect } from "react";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { HTML_LANG } from "@/lib/i18n";
import { useNusa } from "@/lib/store";
import appCss from "../styles.css?url";

const APP_NAME = "Nusa";

function HtmlLang() {
  const lang = useNusa((s) => s.lang);
  useEffect(() => {
    document.documentElement.lang = lang ? HTML_LANG[lang] : "en";
  }, [lang]);
  return null;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Nusa reads a meal photograph and explains helpful compounds and cautions — in the languages of Southeast Asia.",
      },
      { name: "theme-color", content: "#F3EEE4" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Noto+Sans+Khmer:wght@400;500;600&family=Noto+Sans+Lao:wght@400;500;600&family=Noto+Sans+Myanmar:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;600&family=Noto+Sans+Thai:wght@400;500;600&family=Outfit:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground">
        <PreviewHostBridge />
        <AuthProvider>
          <HtmlLang />
          <Outlet />
          <Toaster
            position="top-center"
            theme="light"
            toastOptions={{
              className:
                "font-[Outfit,sans-serif] !bg-card !text-foreground !border-0 !shadow-[var(--shadow-lift)]",
            }}
          />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
