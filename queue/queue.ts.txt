import { apiRequest } from "./client";

export interface QueueEntry {
  id: string;
  userId: string;
  name: string;
  guests: number;
  notificationMethod: "sms" | "email";
  contact: string;
  hall: "AC Hall" | "Main Hall" | "VIP Hall" | "Any";
  segment: "Front" | "Middle" | "Back" | "Any";
  position: number;
  estimatedWaitMinutes: number;
  joinedAt: Date;
  queueDate: string;
  timeSlot: string;
  timeSlotDisplay: string;
  notifiedAt15Min: boolean;
  tableAvailable: boolean;
  tableConfirmed: boolean;       // ← NEW: true once user confirmed the table
  status: string;                // ← NEW: "waiting" | "confirmed" | "cancelled"
  notificationExpiresAt: Date | null;
  fromReservationCancellation: boolean;
}

// ── Wire types ────────────────────────────────────────────────────────────────

type QueueEntryWire = Omit<QueueEntry, "joinedAt" | "notificationExpiresAt"> & {
  joinedAt: string;
  notificationExpiresAt: string | null;
};

function fromWire(entry: QueueEntryWire): QueueEntry {
  return {
    ...entry,
    joinedAt: new Date(entry.joinedAt),
    notificationExpiresAt: entry.notificationExpiresAt
      ? new Date(entry.notificationExpiresAt)
      : null,
    tableConfirmed: entry.tableConfirmed ?? false,
    status: entry.status ?? "waiting",
  };
}

function toWire(entry: Partial<QueueEntry>): any {
  const { joinedAt, notificationExpiresAt, ...rest } = entry;
  return {
    ...rest,
    joinedAt: joinedAt ? joinedAt.toISOString() : undefined,
    notificationExpiresAt: notificationExpiresAt
      ? notificationExpiresAt.toISOString()
      : null,
  };
}

// ── Queue CRUD ────────────────────────────────────────────────────────────────

export async function fetchQueueEntries(
  queueDate?: string,
  userId?: string
): Promise<QueueEntry[]> {
  const params = new URLSearchParams();
  if (queueDate) params.append("queueDate", queueDate);
  if (userId) params.append("userId", userId);

  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await apiRequest<{ entries: QueueEntryWire[] }>(`/api/queue${qs}`);
  return res.entries.map(fromWire);
}

export async function joinQueue(
  entry: Partial<QueueEntry>
): Promise<QueueEntry> {
  const created = await apiRequest<QueueEntryWire>("/api/queue/join", {
    method: "POST",
    body: toWire(entry),
  });
  return fromWire(created);
}

export async function cancelQueueEntry(entryId: string): Promise<void> {
  await apiRequest<{ ok: boolean }>(
    `/api/queue/${encodeURIComponent(entryId)}`,
    { method: "DELETE" }
  );
}

export async function updateQueueEntry(
  entryId: string,
  patch: {
    notifiedAt15Min?: boolean;
    estimatedWaitMinutes?: number;
    tableAvailable?: boolean;
    tableConfirmed?: boolean;      // ← NEW
    status?: string;               // ← NEW
    notificationExpiresAt?: Date | null;
    fromReservationCancellation?: boolean;
  }
): Promise<QueueEntry> {
  const updated = await apiRequest<QueueEntryWire>(
    `/api/queue/${encodeURIComponent(entryId)}`,
    { method: "PATCH", body: toWire(patch) }
  );
  return fromWire(updated);
}

// ── Slot availability ─────────────────────────────────────────────────────────

export async function checkSlotAvailability(params: {
  queueDate: string;
  timeSlot: string;
  guests: number;
  hall: string;
  segment: string;
  excludeUserId?: string;   // ← NEW: prevents user's own confirmed entry from blocking themselves
}): Promise<{ isReserved: boolean; available: boolean }> {
  const queryParams = new URLSearchParams({
    queueDate: params.queueDate,
    timeSlot: params.timeSlot,
    guests: params.guests.toString(),
    hall: params.hall,
    segment: params.segment,
  });

  // Only append if provided
  if (params.excludeUserId) {
    queryParams.append("excludeUserId", params.excludeUserId);
  }

  return await apiRequest<{ isReserved: boolean; available: boolean }>(
    `/api/queue/check-availability?${queryParams.toString()}`
  );
}

// ── NEW: Create a confirmed reservation in the reservations DB ────────────────

export interface ReservationPayload {
  name: string;
  contact: string;
  guests: number;
  hall: string;          // backend format: "AC" | "Main" | "VIP" | "Any"
  segment: string;       // "Front" | "Middle" | "Back" | "Any"
  queueDate: string;     // "YYYY-MM-DD"
  timeSlot: string;      // "HH:MM-HH:MM"
  timeSlotDisplay?: string;
  userId: string;
  reservedAt: string;    // ISO string
  fromQueue: boolean;
  status: string;        // "confirmed"
}

export async function createReservation(
  payload: ReservationPayload
): Promise<{ id: string; [key: string]: any }> {
  return await apiRequest<{ id: string; [key: string]: any }>(
    "/api/reservations",
    {
      method: "POST",
      body: payload,
    }
  );
}

// ── Polling ───────────────────────────────────────────────────────────────────

/**
 * Poll backend every 5 seconds to detect:
 * 1. tableAvailable set by a reservation cancellation
 * 2. Auto-expired entries (3-min timeout passed on backend)
 */
export async function pollQueueStatus(userId: string): Promise<{
  entry: QueueEntry | null;
  tableAvailable: boolean;
  fromReservationCancellation: boolean;
  autoExpired: boolean;
}> {
  const res = await apiRequest<{
    entry: QueueEntryWire | null;
    tableAvailable?: boolean;
    fromReservationCancellation?: boolean;
    autoExpired?: boolean;
  }>(`/api/queue/poll?userId=${encodeURIComponent(userId)}`);

  return {
    entry: res.entry ? fromWire(res.entry) : null,
    tableAvailable: res.tableAvailable ?? false,
    fromReservationCancellation: res.fromReservationCancellation ?? false,
    autoExpired: res.autoExpired ?? false,
  };
}