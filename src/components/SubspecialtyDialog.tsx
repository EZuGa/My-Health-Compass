import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SUBSPECIALTIES,
  getSelectedSubspecialty,
  setSelectedSubspecialty,
} from "@/data/subspecialties";

export function SubspecialtyDialog() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(getSelectedSubspecialty()?.id ?? null);
    const onChange = () => setSelectedId(getSelectedSubspecialty()?.id ?? null);
    window.addEventListener("subspecialty:changed", onChange);
    return () => window.removeEventListener("subspecialty:changed", onChange);
  }, []);

  const choose = (id: string | null) => {
    setSelectedId(id);
    setSelectedSubspecialty(id);
  };

  const current = SUBSPECIALTIES.find((s) => s.id === selectedId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="subspecialty-tab w-full text-center text-xs uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel cursor-pointer relative overflow-hidden"
        >
          <span className="relative z-10">
            Subspecialty
            {current && (
              <span className="block normal-case tracking-normal text-[10px] font-bold mt-0.5 opacity-80">
                {current.name}
              </span>
            )}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[color:var(--background)] border border-foreground/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-xs uppercase tracking-[0.22em] font-extrabold">
            Select Subspecialty
          </DialogTitle>
        </DialogHeader>
        <p className="text-[12px] opacity-75 mt-1">
          Choose a subspecialty to organize the next generated Medical History around its
          priorities. Leave none selected to use the default NEJM-style format.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => choose(null)}
            className={
              "text-[11px] uppercase tracking-[0.18em] font-extrabold px-3 py-1.5 rounded-md cloud-panel " +
              (selectedId === null ? "ring-2 ring-foreground/60" : "")
            }
          >
            None (default)
          </button>
          {current && (
            <span className="text-[11px] font-bold opacity-70">
              Selected: {current.name}
            </span>
          )}
        </div>

        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUBSPECIALTIES.map((s) => {
            const active = s.id === selectedId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => choose(s.id)}
                  className={
                    "w-full text-left text-[12px] font-bold px-3 py-2 rounded-md border transition " +
                    (active
                      ? "border-foreground/70 bg-[linear-gradient(160deg,#fff4c2_0%,#e9c66a_100%)] text-[#3a2a05]"
                      : "border-foreground/20 hover:bg-[color:var(--mint-soft)]")
                  }
                >
                  {s.name}
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
