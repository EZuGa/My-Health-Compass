import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Search, Menu, X } from "lucide-react";
import { SearchDialog } from "./SearchDialog";

import { MedicalHistoryDialog } from "./MedicalHistoryDialog";
import { SubspecialtyDialog } from "./SubspecialtyDialog";
import { LogoMark } from "./LogoMark";
import { GlobalDisclaimer } from "./GlobalDisclaimer";
import { auth, getCachedUser, api, type Section } from "@/lib/api";
import { useSelectedPatient, setSelectedPatient } from "@/lib/selectedPatient";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(getCachedUser()?.role ?? null);
  const [sections, setSections] = useState<Section[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // The patient a doctor currently has open; drives the nav and the banner.
  const selected = useSelectedPatient();

  useEffect(() => {
    api
      .catalogSections()
      .then(setSections)
      .catch(() => setSections([]));
  }, []);

  useEffect(() => {
    const cached = getCachedUser();
    setEmail(cached?.email ?? null);
    setRole(cached?.role ?? null);
    auth
      .me()
      .then((u) => {
        setEmail(u.email);
        setRole(u.role);
      })
      .catch(() => {});
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
    auth.logout();
    setSelectedPatient(null);
    navigate({ to: "/auth", replace: true });
  };

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen w-full">
      <GlobalDisclaimer />
      {/* Top bar */}
      <header className="px-4 py-3 flex items-center bg-background/70 backdrop-blur-sm border-b border-foreground/20">
        {/* Left — hamburger (mobile) | full branding (desktop) */}
        <div className="flex-1 flex items-center justify-start">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center justify-center p-1.5 -ml-1 shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="hidden md:flex flex-col items-start leading-none">
            <span
              className="[font-family:'EB_Garamond',ui-serif,Georgia,serif] italic font-medium text-lg tracking-normal text-foreground [font-feature-settings:'liga','dlig','onum']"
              style={{
                textShadow: "0 1px 1px rgba(107,142,90,0.45), 0 2px 6px rgba(107,142,90,0.3)",
              }}
            >
              The Health Passport
            </span>
            <span
              className="[font-family:'EB_Garamond',ui-serif,Georgia,serif] font-medium text-lg tracking-[0.18em] text-[#b8243a] [font-feature-settings:'liga','dlig','onum'] mt-1 self-center"
              style={{
                textShadow:
                  "0 1px 0 rgba(255,255,255,0.7), 1px 2px 0 rgba(180,150,220,0.35), 2px 4px 6px rgba(120,90,180,0.25), 3px 6px 14px rgba(120,90,180,0.18)",
              }}
            >
              ZRUNVA
            </span>
          </Link>
        </div>

        {/* Center — ZRUNVA home link (mobile) | LogoMark (desktop) */}
        <div className="flex-1 flex items-center justify-center">
          <Link
            to="/"
            className="md:hidden [font-family:'EB_Garamond',ui-serif,Georgia,serif] font-medium text-xl tracking-[0.18em] text-[#b8243a] [font-feature-settings:'liga','dlig','onum']"
            style={{
              textShadow:
                "0 1px 0 rgba(255,255,255,0.7), 1px 2px 0 rgba(180,150,220,0.35), 2px 4px 6px rgba(120,90,180,0.25)",
            }}
          >
            ZRUNVA
          </Link>
          <div className="hidden md:block pointer-events-none">
            <LogoMark />
          </div>
        </div>

        {/* Right — search icon always | email + sign out (desktop only) */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-2 md:px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] font-extrabold border border-foreground/40 rounded-md hover:bg-[color:var(--mint-soft)]"
            title="Search (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Search</span>
            <span className="hidden md:inline opacity-60 normal-case tracking-normal">⌘K</span>
          </button>
          {email && (
            <div className="hidden md:flex items-center gap-2 border-l border-foreground/20 pl-3">
              <span
                className="text-[11px] uppercase tracking-[0.14em] font-extrabold max-w-[160px] truncate"
                title={email}
              >
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

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-0">
        {/* Sidebar */}
        <aside
          className={`flex flex-col px-4 pt-2 pb-4 overflow-y-auto bg-background/40 backdrop-blur-sm border-r border-foreground/15 md:sticky md:top-[49px] md:h-[calc(100vh-49px)] ${
            sidebarOpen ? "fixed inset-0 z-50 bg-background" : "hidden md:flex"
          }`}
        >
          {/* Close button — mobile only */}
          <div className="flex items-center justify-between py-2 mb-2 md:hidden border-b border-foreground/15">
            <span className="text-[11px] uppercase tracking-[0.18em] font-extrabold">Menu</span>
            <button
              type="button"
              onClick={closeSidebar}
              className="p-1.5 hover:bg-[color:var(--mint-soft)] rounded-md"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {/* A doctor who hasn't opened a patient only gets the link back to
                the search page; everyone else gets the full navigation. */}
            {role === "doctor" && !selected ? (
              <Link
                to="/"
                onClick={closeSidebar}
                className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
                style={{
                  background: "linear-gradient(160deg, #ffe0b8 0%, #f0a35a 100%)",
                  color: "#4a2a10",
                }}
              >
                Find a patient
              </Link>
            ) : (
              <>
                <details className="group rounded-md cloud-panel overflow-hidden">
                  <summary
                    className="cursor-pointer list-none block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md"
                    style={{
                      background: "linear-gradient(160deg, #d8e0ff 0%, #d9c6ee 50%, #f3cfe2 100%)",
                      color: "#3a2a55",
                    }}
                  >
                    Clinical Record
                  </summary>
                  <ul className="space-y-0.5 mt-2 px-1">
                    {sections.map((s) => {
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
                            <Link to="/timeline" className={className} onClick={closeSidebar}>
                              {s.title}
                            </Link>
                          ) : (
                            <Link
                              to="/section/$sectionId"
                              params={{ sectionId: s.id }}
                              className={className}
                              onClick={closeSidebar}
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
                  onClick={closeSidebar}
                  className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
                  style={{
                    background: "linear-gradient(160deg, #bcd0a6 0%, #9caf88 100%)",
                    color: "#1a2a18",
                  }}
                >
                  Calendar
                </Link>

                <Link
                  to="/connections"
                  onClick={closeSidebar}
                  className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
                  style={{
                    background: "linear-gradient(160deg, #ffe6ec 0%, #ffc2d2 100%)",
                    color: "#5a1a2e",
                  }}
                >
                  Data Connections
                </Link>

                <Link
                  to="/forms"
                  onClick={closeSidebar}
                  className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
                  style={{
                    background: "linear-gradient(160deg, #d5ecd5 0%, #a8d5a8 100%)",
                    color: "#163019",
                  }}
                >
                  Medical Forms
                </Link>

                <Link
                  to="/toxcheck"
                  onClick={closeSidebar}
                  className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
                  style={{
                    background: "linear-gradient(160deg, #ffc2d2 0%, #b8243a 100%)",
                    color: "#fff",
                  }}
                >
                  ToxCheck
                </Link>

                {/* Backend-powered EHR (consent-based records API) */}
                <div className="mt-2 pt-2 border-t border-foreground/15 flex flex-col gap-2">
                  <span className="text-center text-[9px] uppercase tracking-[0.2em] font-extrabold opacity-50">
                    Electronic Health Record
                  </span>
                  <>
                    <Link
                      to="/records"
                      onClick={closeSidebar}
                      className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
                      style={{
                        background: "linear-gradient(160deg, #d8e0ff 0%, #d9c6ee 100%)",
                        color: "#2a2a55",
                      }}
                    >
                      Health Records
                    </Link>
                    <Link
                      to="/intake"
                      onClick={closeSidebar}
                      className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
                      style={{
                        background: "linear-gradient(160deg, #cde7d6 0%, #9fd3b4 100%)",
                        color: "#153019",
                      }}
                    >
                      AI Intake
                    </Link>
                  </>
                  {role === "doctor" && selected && (
                    <Link
                      to="/assessments"
                      onClick={closeSidebar}
                      className="block text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel"
                      style={{
                        background: "linear-gradient(160deg, #ffe0b8 0%, #f0a35a 100%)",
                        color: "#4a2a10",
                      }}
                    >
                      Assessments
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex-1" />

          {/* Account — shown at bottom of sidebar on mobile only */}
          {email && (
            <div className="md:hidden border-t border-foreground/15 pt-3 mt-2 flex flex-col gap-2">
              <span
                className="text-[11px] uppercase tracking-[0.14em] font-extrabold truncate opacity-60"
                title={email}
              >
                {email}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="px-3 py-2 text-[11px] uppercase tracking-wider font-extrabold border border-foreground/40 hover:bg-[color:var(--mint-soft)] text-left"
              >
                Sign out
              </button>
            </div>
          )}
        </aside>

        <main className="px-4 md:px-8 py-6 flex flex-col gap-6 min-h-[calc(100vh-49px)]">
          {role === "doctor" && selected && (
            <div className="max-w-5xl w-full flex items-center justify-between gap-3 flex-wrap border border-foreground/25 bg-[color:var(--mint-soft)] px-3 py-2 rounded-md">
              <span className="text-[12px] font-extrabold uppercase tracking-wider">
                Viewing record: {selected.name} · patient #{selected.id}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  navigate({ to: "/" });
                }}
                className="px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold border border-foreground/40 hover:bg-background"
              >
                Exit patient view
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
