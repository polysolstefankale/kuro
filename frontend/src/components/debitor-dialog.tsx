"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { Debitor, DebitorFormData } from "@/types/debitor";
import { emptyDebitorForm } from "@/types/debitor";
import type { WaehrungInfo } from "@/lib/waehrung";
import { DEFAULT_WAEHRUNG } from "@/lib/waehrung";
import { fetchWaehrungen } from "@/lib/api";
import {
  COMPANY_SEARCH_MIN_LENGTH,
  type CompanyAddressResult,
} from "@/lib/company-search";
import { isKnownLand, LAND_OPTIONS } from "@/lib/plz";
import { Dialog } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { PlzLookup } from "@/components/plz-lookup";



interface DebitorDialogProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  debitor?: Debitor | null;

  onSave: (form: DebitorFormData) => Promise<void>;

}



const selectClassName =
  "flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/60";



export function DebitorDialog({

  open,

  onOpenChange,

  debitor,

  onSave,

}: DebitorDialogProps) {

  const [form, setForm] = useState<DebitorFormData>(emptyDebitorForm());

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [customLand, setCustomLand] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState<
    CompanyAddressResult[]
  >([]);
  const [companySearching, setCompanySearching] = useState(false);
  const [waehrungen, setWaehrungen] = useState<WaehrungInfo[]>([]);

  const isEdit = !!debitor;

  const applyCompanyResult = useCallback((result: CompanyAddressResult) => {
    setForm((prev) => ({
      ...prev,
      name: result.name || prev.name,
      strasse: result.strasse,
      plz: result.plz,
      ort: result.ort,
      land: result.land,
      hauptnummer: result.hauptnummer || prev.hauptnummer,
    }));
    setCustomLand(!isKnownLand(result.land));
    setCompanySuggestions([]);
  }, []);


  useEffect(() => {
    if (!open) return;

    fetchWaehrungen()
      .then(setWaehrungen)
      .catch(() => setWaehrungen([]));
  }, [open]);

  useEffect(() => {

    if (open) {

      if (debitor) {

        setForm({

          debitorNummer: debitor.debitorNummer,

          name: debitor.name,

          strasse: debitor.strasse,

          plz: debitor.plz,

          ort: debitor.ort,

          land: debitor.land,

          umsatz: debitor.umsatz,

          waehrung: debitor.waehrung || DEFAULT_WAEHRUNG,

          status: debitor.status,

          hauptnummer: debitor.hauptnummer,

        });

        setCustomLand(!isKnownLand(debitor.land));

      } else {

        setForm(emptyDebitorForm());

        setCustomLand(false);
      }
      setError(null);
      setCompanySuggestions([]);
    }
  }, [open, debitor]);

  useEffect(() => {
    if (!open) return;

    const query = form.name.trim();
    if (query.length < COMPANY_SEARCH_MIN_LENGTH || !form.land) {
      setCompanySuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCompanySearching(true);
      try {
        const res = await fetch(
          `/lookup/company?name=${encodeURIComponent(query)}&land=${encodeURIComponent(form.land)}`,
        );
        if (!res.ok) {
          setCompanySuggestions([]);
          return;
        }

        const data: CompanyAddressResult[] = await res.json();
        const addressEmpty = !form.strasse && !form.plz && !form.ort;

        if (data.length === 1 && addressEmpty) {
          applyCompanyResult(data[0]);
          return;
        }

        if (data.length === 1 && !form.hauptnummer && data[0].hauptnummer) {
          updateField("hauptnummer", data[0].hauptnummer);
          setCompanySuggestions([]);
          return;
        }

        setCompanySuggestions(data);
      } finally {
        setCompanySearching(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    open,
    form.name,
    form.land,
    form.strasse,
    form.plz,
    form.ort,
    form.hauptnummer,
    applyCompanyResult,
  ]);

  async function searchCompanyNow() {
    const query = form.name.trim();
    if (query.length < COMPANY_SEARCH_MIN_LENGTH || !form.land) return;

    setCompanySearching(true);
    try {
      const res = await fetch(
        `/lookup/company?name=${encodeURIComponent(query)}&land=${encodeURIComponent(form.land)}`,
      );
      if (!res.ok) {
        setCompanySuggestions([]);
        return;
      }

      const data: CompanyAddressResult[] = await res.json();
      if (data.length === 1) {
        applyCompanyResult(data[0]);
      } else {
        setCompanySuggestions(data);
      }
    } finally {
      setCompanySearching(false);
    }
  }


  function updateField<K extends keyof DebitorFormData>(

    key: K,

    value: DebitorFormData[K],

  ) {

    setForm((prev) => ({ ...prev, [key]: value }));

  }



  function handleLandSelect(value: string) {

    if (value === "Andere") {

      setCustomLand(true);

      updateField("land", "");

      return;

    }

    setCustomLand(false);

    updateField("land", value);

  }



  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    setSaving(true);

    setError(null);

    try {

      await onSave(form);

      onOpenChange(false);

    } catch (err) {

      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");

    } finally {

      setSaving(false);

    }

  }



  const landSelectValue = customLand

    ? "Andere"

    : isKnownLand(form.land)

      ? form.land

      : "Andere";



  return (

    <Dialog

      open={open}

      onOpenChange={onOpenChange}

      title={isEdit ? "Debitor bearbeiten" : "Neuer Debitor"}

      description={

        isEdit

          ? "Stammdaten des Debitors aktualisieren."

          : "Einen neuen Debitor im System anlegen."

      }

      className="max-w-2xl overflow-visible"

    >

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid grid-cols-2 gap-4 overflow-visible">

          {isEdit ? (

            <div className="space-y-2">

              <Label htmlFor="debitorNummer">Debitornummer</Label>

              <Input

                id="debitorNummer"

                value={form.debitorNummer}

                readOnly

                className="bg-slate-50 text-slate-600"

              />

            </div>

          ) : (

            <div className="space-y-2">

              <Label>Debitornummer</Label>

              <p className="flex h-9 items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">

                Wird automatisch vergeben (z.&nbsp;B. D000001)

              </p>

            </div>

          )}

          <div className="relative space-y-2">
            <Label htmlFor="name">Name *</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                autoComplete="organization"
              />
              <Button
                type="button"
                variant="outline"
                title="Firmenadresse online suchen"
                disabled={
                  companySearching ||
                  form.name.trim().length < COMPANY_SEARCH_MIN_LENGTH ||
                  !form.land
                }
                onClick={searchCompanyNow}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {companySearching && (
              <p className="text-xs text-slate-400">Firmenadresse wird gesucht…</p>
            )}
            {!companySearching && companySuggestions.length === 0 && form.name.trim().length >= COMPANY_SEARCH_MIN_LENGTH && (
              <p className="text-xs text-slate-400">
                Name eingeben — passende Firmen werden automatisch gesucht
              </p>
            )}
            {companySuggestions.length > 0 && (
              <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
                {companySuggestions.map((item) => (
                  <li key={`${item.name}-${item.plz}-${item.ort}`}>
                    <button
                      type="button"
                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => applyCompanyResult(item)}
                    >
                      <span className="font-medium text-slate-900">{item.name}</span>
                      <span className="text-slate-500">
                        {[item.strasse, [item.plz, item.ort].filter(Boolean).join(" ")]
                          .filter(Boolean)
                          .join(", ") || "—"}
                        {item.hauptnummer ? ` · ${item.hauptnummer}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="col-span-2 space-y-2">

            <Label htmlFor="strasse">Straße</Label>

            <Input

              id="strasse"

              value={form.strasse}

              onChange={(e) => updateField("strasse", e.target.value)}

            />

          </div>

          <div className="space-y-2">

            <Label htmlFor="land">Land</Label>

            <select

              id="land"

              value={landSelectValue}

              onChange={(e) => handleLandSelect(e.target.value)}

              className={selectClassName}

            >

              {LAND_OPTIONS.map((option) => (

                <option key={option.value} value={option.value}>

                  {option.label}

                </option>

              ))}

              <option value="Andere">Andere</option>

            </select>

          </div>

          {customLand ? (

            <div className="space-y-2">

              <Label htmlFor="landCustom">Land (frei)</Label>

              <Input

                id="landCustom"

                value={form.land}

                onChange={(e) => updateField("land", e.target.value)}

                placeholder="Land eingeben"

              />

            </div>

          ) : (

            <div />

          )}

          <PlzLookup

            land={form.land}

            plz={form.plz}

            ort={form.ort}

            onPlzChange={(value) => updateField("plz", value)}

            onOrtChange={(value) => updateField("ort", value)}

          />

          <div className="space-y-2">

            <Label htmlFor="hauptnummer">Hauptnummer (Telefon)</Label>

            <Input

              id="hauptnummer"

              value={form.hauptnummer}

              onChange={(e) => updateField("hauptnummer", e.target.value)}

            />

          </div>

          <div className="space-y-2">

            <Label htmlFor="umsatz">Umsatz</Label>

            <Input
              id="umsatz"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={form.umsatz === 0 ? "" : String(form.umsatz)}
              onChange={(e) => {
                const raw = e.target.value.replace(",", ".").trim();
                if (raw === "") {
                  updateField("umsatz", 0);
                  return;
                }
                const parsed = Number.parseFloat(raw);
                if (!Number.isNaN(parsed)) {
                  updateField("umsatz", parsed);
                }
              }}
            />

          </div>

          <div className="space-y-2">

            <Label htmlFor="waehrung">Währung</Label>

            <select
              id="waehrung"
              value={form.waehrung || DEFAULT_WAEHRUNG}
              onChange={(e) => updateField("waehrung", e.target.value)}
              className={selectClassName}
            >
              {waehrungen.length > 0 ? (
                waehrungen.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} — {w.name}
                  </option>
                ))
              ) : (
                <option value={form.waehrung || DEFAULT_WAEHRUNG}>
                  {form.waehrung || DEFAULT_WAEHRUNG}
                </option>
              )}
            </select>

          </div>

          <div className="space-y-2">

            <Label htmlFor="status">Status</Label>

            <select

              id="status"

              value={form.status}

              onChange={(e) =>

                updateField("status", e.target.value as DebitorFormData["status"])

              }

              className={selectClassName}

            >

              <option value="Aktiv">Aktiv</option>

              <option value="Inaktiv">Inaktiv</option>

            </select>

          </div>

        </div>



        {error && (

          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">

            {error}

          </p>

        )}



        <div className="flex justify-end gap-2 pt-2">

          <Button

            type="button"

            variant="outline"

            onClick={() => onOpenChange(false)}

            disabled={saving}

          >

            Abbrechen

          </Button>

          <Button type="submit" disabled={saving}>

            {saving ? "Speichern…" : isEdit ? "Aktualisieren" : "Anlegen"}

          </Button>

        </div>

      </form>

    </Dialog>

  );

}


