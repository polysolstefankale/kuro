"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface DebitorFilterOption {
  id: number;
  name: string;
}

interface DebitorFilterSelectProps {
  value: number | "alle";
  onChange: (value: number | "alle") => void;
  options: DebitorFilterOption[];
  className?: string;
}

export function DebitorFilterSelect({
  value,
  onChange,
  options,
  className,
}: DebitorFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    value === "alle"
      ? "Alle Debitoren"
      : (options.find((o) => o.id === value)?.name ?? "Debitor wählen");

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  function selectOption(next: number | "alle") {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative min-w-[220px]", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-800 focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/60"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Debitorfilter"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                autoFocus
                type="search"
                placeholder="Debitor suchen…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 pl-8"
              />
            </div>
          </div>

          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={value === "alle"}
                onClick={() => selectOption("alle")}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                  value === "alle" && "bg-slate-100 font-medium text-slate-900",
                )}
              >
                Alle Debitoren
              </button>
            </li>

            {filteredOptions.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option.id}
                  onClick={() => selectOption(option.id)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                    value === option.id && "bg-slate-100 font-medium text-slate-900",
                  )}
                >
                  {option.name}
                </button>
              </li>
            ))}

            {query.trim() && filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500">Keine Debitoren gefunden.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
