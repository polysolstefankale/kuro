"use client";

import { useEffect, useState } from "react";
import type { Kontakt, KontaktFormData } from "@/types/kontakt";
import { emptyKontaktForm, STANDORT_OPTIONS } from "@/types/kontakt";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface KontaktDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debitorId: number;
  kontakt?: Kontakt | null;
  onSave: (form: KontaktFormData) => Promise<void>;
}

const selectClassName =
  "flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/60";

export function KontaktDialog({
  open,
  onOpenChange,
  debitorId,
  kontakt,
  onSave,
}: KontaktDialogProps) {
  const [form, setForm] = useState<KontaktFormData>(emptyKontaktForm(debitorId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!kontakt;

  useEffect(() => {
    if (open) {
      if (kontakt) {
        setForm({
          vorname: kontakt.vorname,
          nachname: kontakt.nachname,
          email: kontakt.email,
          telefon: kontakt.telefon,
          standort: kontakt.standort,
          debitorId: kontakt.debitorId,
        });
      } else {
        setForm(emptyKontaktForm(debitorId));
      }
      setError(null);
    }
  }, [open, kontakt, debitorId]);

  function updateField<K extends keyof KontaktFormData>(
    key: K,
    value: KontaktFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
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

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Kontakt bearbeiten" : "Neuer Kontakt"}
      description={
        isEdit
          ? "Kontaktdaten aktualisieren."
          : "Einen neuen Kontakt für diesen Debitor anlegen."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kontakt-vorname">Vorname</Label>
            <Input
              id="kontakt-vorname"
              value={form.vorname}
              onChange={(e) => updateField("vorname", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontakt-nachname">Nachname *</Label>
            <Input
              id="kontakt-nachname"
              value={form.nachname}
              onChange={(e) => updateField("nachname", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontakt-email">E-Mail</Label>
            <Input
              id="kontakt-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontakt-telefon">Telefon</Label>
            <Input
              id="kontakt-telefon"
              value={form.telefon}
              onChange={(e) => updateField("telefon", e.target.value)}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="kontakt-standort">Standort *</Label>
            <select
              id="kontakt-standort"
              value={form.standort}
              onChange={(e) =>
                updateField("standort", e.target.value as KontaktFormData["standort"])
              }
              className={selectClassName}
              required
            >
              {STANDORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
