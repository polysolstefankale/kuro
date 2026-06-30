"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Kontakt, KontaktFormData } from "@/types/kontakt";
import { kontaktDisplayName } from "@/types/kontakt";
import {
  createKontakt,
  deleteKontakt,
  fetchKontakte,
  updateKontakt,
} from "@/lib/api";
import { KontaktDialog } from "@/components/kontakt-dialog";
import { Button } from "@/components/ui/button";

interface KontaktePanelProps {
  debitorId: number;
}

export function KontaktePanel({ debitorId }: KontaktePanelProps) {
  const [kontakte, setKontakte] = useState<Kontakt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKontakt, setEditingKontakt] = useState<Kontakt | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const loadKontakte = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchKontakte(debitorId);
      setKontakte(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kontakte konnten nicht geladen werden",
      );
    } finally {
      setLoading(false);
    }
  }, [debitorId]);

  useEffect(() => {
    loadKontakte();
  }, [loadKontakte]);

  function openCreate() {
    setEditingKontakt(null);
    setDialogOpen(true);
  }

  function openEdit(kontakt: Kontakt) {
    setEditingKontakt(kontakt);
    setDialogOpen(true);
  }

  async function handleSave(form: KontaktFormData) {
    if (editingKontakt) {
      await updateKontakt(editingKontakt.id, form);
    } else {
      await createKontakt(form);
    }
    await loadKontakte();
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteKontakt(id);
      setConfirmId(null);
      await loadKontakte();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Kontakte</h3>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Kontakt
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Kontakte werden geladen…</p>
      )}

      {error && (
        <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && kontakte.length === 0 && !error && (
        <p className="text-sm text-slate-500">Noch keine Kontakte vorhanden.</p>
      )}

      {!loading && kontakte.length > 0 && (
        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-3 py-2 font-medium text-slate-600">Name</th>
                <th className="px-3 py-2 font-medium text-slate-600">E-Mail</th>
                <th className="px-3 py-2 font-medium text-slate-600">Telefon</th>
                <th className="px-3 py-2 font-medium text-slate-600">Standort</th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kontakte.map((kontakt) => (
                <tr key={kontakt.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {kontaktDisplayName(kontakt) || "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {kontakt.email || "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {kontakt.telefon || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {kontakt.standort}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(kontakt)}
                        title="Bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {confirmId === kontakt.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">Löschen?</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deletingId === kontakt.id}
                            onClick={() => handleDelete(kontakt.id)}
                          >
                            Ja
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmId(null)}
                          >
                            Nein
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setConfirmId(kontakt.id)}
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <KontaktDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        debitorId={debitorId}
        kontakt={editingKontakt}
        onSave={handleSave}
      />
    </div>
  );
}
