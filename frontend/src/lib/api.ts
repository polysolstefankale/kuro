import type { Debitor, DebitorFormData } from "@/types/debitor";
import type { Kontakt, KontaktFormData } from "@/types/kontakt";
import type { WaehrungInfo } from "@/lib/waehrung";
import { getToken } from "@/lib/auth";export interface LoginResponse {
  token: string;
  username: string;
  provider: string;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body.detail ?? body.title ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchDebitoren(): Promise<Debitor[]> {
  const data = await apiFetch<{ debitoren: Debitor[] }>("/api/debitoren");
  return data.debitoren ?? [];
}

export async function fetchWaehrungen(): Promise<WaehrungInfo[]> {
  const data = await apiFetch<{ waehrungen: WaehrungInfo[] }>("/api/waehrungen");
  return data.waehrungen ?? [];
}

export async function createDebitor(form: DebitorFormData): Promise<Debitor> {  const { debitorNummer: _, ...payload } = form;
  return apiFetch<Debitor>("/api/debitoren", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDebitor(
  id: number,
  form: DebitorFormData,
): Promise<Debitor> {
  const { debitorNummer: _, ...payload } = form;
  return apiFetch<Debitor>(`/api/debitoren/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteDebitor(id: number): Promise<void> {
  await apiFetch<void>(`/api/debitoren/${id}`, { method: "DELETE" });
}

export async function fetchKontakte(debitorId: number): Promise<Kontakt[]> {
  const data = await apiFetch<{ kontakte: Kontakt[] }>(
    `/api/kontakte?debitorId=${debitorId}`,
  );
  return data.kontakte ?? [];
}

export async function createKontakt(form: KontaktFormData): Promise<Kontakt> {
  return apiFetch<Kontakt>("/api/kontakte", {
    method: "POST",
    body: JSON.stringify(form),
  });
}

export async function updateKontakt(
  id: number,
  form: KontaktFormData,
): Promise<Kontakt> {
  return apiFetch<Kontakt>(`/api/kontakte/${id}`, {
    method: "PUT",
    body: JSON.stringify(form),
  });
}

export async function deleteKontakt(id: number): Promise<void> {
  await apiFetch<void>(`/api/kontakte/${id}`, { method: "DELETE" });
}