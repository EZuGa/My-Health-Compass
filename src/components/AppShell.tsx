import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { SearchDialog } from "./SearchDialog";

import { MedicalHistoryDialog } from "./MedicalHistoryDialog";
import { SubspecialtyDialog } from "./SubspecialtyDialog";
import { LogoMark } from "./LogoMark";
import { GlobalDisclaimer } from "./GlobalDisclaimer";
import { nejmSections } from "@/data/health";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen w-full">
      <GlobalDisclaimer />
      {/* Top bar */}
      <header className="relative px-6 py-3 flex items-center justify-between gap-4 bg-background/70 backdrop-blur-sm border-b border-foreground/20">
        <Link to="/" className="flex flex-col items-start leading-none">
          <span
            className="[font-family:'EB_Garamond',ui-serif,Georgia,serif] italic font-medium text-lg tracking-normal text-foreground [font-feature-settings:'liga','dlig','onum']"
            style={{ textShadow: "0 1px 1px rgba(107,142,90,0.45), 0 2px 6px rgba(107,142,90,0.3)" }}
          >
            The Health Passport
          </span>
          <span
            className="[font-family:'EB_Garamond',ui-serif,Georgia,serif] font-medium text-lg tracking-[0.18em] text-[#b8243a] [font-feature-settings:'liga','dlig','onum'] mt-1 self-center"
            style={{ textShadow: "0 1px 0 rgba(255,255,255,0.7), 1px 2px 0 rgba(180,150,220,0.35), 2px 4px 6px rgba(120,90,180,0.25), 3px 6px 14px rgba(120,90,180,0.18)" }}
          >
            ZRUNVA
          </span>
        </Link>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <LogoMark />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] font-extrabold border border-foreground/40 rounded-md hover:bg-[color:var(--mint-soft)]"
            title="Search (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            Search
            <span className="hidden md:inline opacity-60 normal-case tracking-normal">⌘K</span>
          </button>
          {email && (
            <div className="flex items-center gap-2 border-l border-foreground/20 pl-3">
              <span className="text-[11px] uppercase tracking-[0.14em] font-extrabold max-w-[160px] truncate" title={email}>
                {email}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="px-2 py-1 text-[10px] uppercase tracking-wider font-extrabold border border-foreground/40 hover:bg-[color:var(--mint-soft)]"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />




      <div className="grid grid-cols-[260px_1fr] gap-0">
        {/* Sidebar */}
        <aside className="px-4 pt-2 pb-4 sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto bg-background/40 backdrop-blur-sm border-r border-foreground/15 flex flex-col">
          <div className="flex flex-col gap-2">
            <details className="group rounded-md cloud-panel overflow-hidden">
              <summary
                className="cursor-pointer list-none block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md"
                style={{ background: "linear-gradient(160deg, #d8e0ff 0%, #d9c6ee 50%, #f3cfe2 100%)", color: "#3a2a55" }}
              >
                Clinical Record
              </summary>
              <ul className="space-y-0.5 mt-2 px-1">
                {nejmSections.map((s) => {
                  const isTimeline = s.id === "timeline";
                  const to = isTimeline ? "/timeline" : `/section/${s.id}`;
                  const active = pathname === to;
                  const className = `block text-[13px] leading-tight py-1.5 px-2 rounded-md font-bold transition ${
                    active
                      ? "bg-[color:var(--mint)] shadow-[0_2px_8px_-2px_rgba(20,50,60,0.25)]"
                      : "hover:bg-[color:var(--mint-soft)]"
                  }`;
                  return (
                    <li key={s.id}>
                      {isTimeline ? (
                        <Link to="/timeline" className={className}>
                          {s.title}
                        </Link>
                      ) : (
                        <Link
                          to="/section/$sectionId"
                          params={{ sectionId: s.id }}
                          className={className}
                        >
                          {s.title}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>

            <SubspecialtyDialog />
            <MedicalHistoryDialog />


            <Link
              to="/calendar"
              className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
              style={{ background: "linear-gradient(160deg, #bcd0a6 0%, #9caf88 100%)", color: "#1a2a18" }}
            >
              Calendar
            </Link>

            <Link
              to="/connections"
              className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
              style={{ background: "linear-gradient(160deg, #ffe6ec 0%, #ffc2d2 100%)", color: "#5a1a2e" }}
            >
              Data Connections
            </Link>

            <Link
              to="/forms"
              className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
              style={{ background: "linear-gradient(160deg, #d5ecd5 0%, #a8d5a8 100%)", color: "#163019" }}
            >
              Medical Forms
            </Link>

            <Link
              to="/toxcheck"
              className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
              style={{ background: "linear-gradient(160deg, #ffc2d2 0%, #b8243a 100%)", color: "#fff" }}
            >
              ToxCheck
            </Link>

          </div>

          <div className="flex-1" />


        </aside>

        <main className="px-8 py-6 flex flex-col gap-6 min-h-[calc(100vh-49px)]">{children}</main>
      </div>
    </div>
  );
}
