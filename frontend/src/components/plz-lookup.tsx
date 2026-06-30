"use client";

import { useEffect, useState } from "react";
import type { PlzLocality } from "@/lib/plz";
import { minSearchLength, supportsPlzLookup } from "@/lib/plz";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ActiveField = "plz" | "ort" | null;

interface PlzLookupProps {
  land: string;
  plz: string;
  ort: string;
  onPlzChange: (plz: string) => void;
  onOrtChange: (ort: string) => void;
}

function SuggestionList({
  suggestions,
  onSelect,
}: {
  suggestions: PlzLocality[];
  onSelect: (loc: PlzLocality) => void;
}) {
  return (
    <ul className="absolute z-[100] mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
      {suggestions.map((loc, index) => (
        <li key={`${loc.postalCode}-${loc.name}-${index}`}>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(loc)}
          >
            <span className="font-mono">{loc.postalCode}</span> {loc.name}
            {loc.canton?.shortName && (
              <span className="ml-2 text-slate-400">
                {loc.canton.shortName}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PlzLookup({
  land,
  plz,
  ort,
  onPlzChange,
  onOrtChange,
}: PlzLookupProps) {
  const [suggestions, setSuggestions] = useState<PlzLocality[]>([]);
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supportsPlzLookup(land) || !activeField) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const query = activeField === "plz" ? plz.trim() : ort.trim();
    if (query.length < minSearchLength()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const param =
      activeField === "plz"
        ? `postalCode=${encodeURIComponent(query)}`
        : `name=${encodeURIComponent(query)}`;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/lookup/locality?land=${encodeURIComponent(land)}&${param}`,
        );
        if (res.ok) {
          const data: PlzLocality[] = await res.json();
          setSuggestions(data);
          setOpen(data.length > 0);
        } else {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [land, plz, ort, activeField]);

  function selectLocality(loc: PlzLocality) {
    onPlzChange(loc.postalCode);
    onOrtChange(loc.name);
    setOpen(false);
    setSuggestions([]);
    setActiveField(null);
  }

  const hint = supportsPlzLookup(land)
    ? "PLZ oder Ort eingeben, Vorschlag wählen — beides bleibt manuell änderbar"
    : null;

  return (
    <>
      <div className="relative space-y-2 overflow-visible">
        <Label htmlFor="plz">PLZ</Label>
        <Input
          id="plz"
          value={plz}
          onChange={(e) => {
            onPlzChange(e.target.value);
            setActiveField("plz");
            setOpen(true);
          }}
          onFocus={() => {
            setActiveField("plz");
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          autoComplete="off"
        />
        {activeField === "plz" && open && suggestions.length > 0 && (
          <SuggestionList suggestions={suggestions} onSelect={selectLocality} />
        )}
      </div>
      <div className="relative space-y-2 overflow-visible">
        <Label htmlFor="ort">Ort</Label>
        <Input
          id="ort"
          value={ort}
          onChange={(e) => {
            onOrtChange(e.target.value);
            setActiveField("ort");
            setOpen(true);
          }}
          onFocus={() => {
            setActiveField("ort");
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          autoComplete="off"
        />
        {activeField === "ort" && open && suggestions.length > 0 && (
          <SuggestionList suggestions={suggestions} onSelect={selectLocality} />
        )}
        {loading && activeField && (
          <p className="text-xs text-slate-400">Wird gesucht…</p>
        )}
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </>
  );
}
