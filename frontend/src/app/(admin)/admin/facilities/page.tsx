"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusCircle,
  Search,
  Pencil,
  Building2,
  XCircle,
  Wrench,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { catalogApi } from "@/lib/services";
import { Skeleton } from "@/components/ui/states";
import type { Facility, FacilityStatus } from "@/lib/types";

// ── Status styles ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<FacilityStatus, string> = {
  active: "bg-primary-fixed text-on-primary-fixed-variant",
  maintenance: "bg-surface-container-highest text-on-surface-variant",
  inactive: "bg-error-container text-on-error-container",
};

const STATUS_ICONS: Record<FacilityStatus, React.ReactNode> = {
  active: <CheckCircle className="size-3" />,
  maintenance: <Wrench className="size-3" />,
  inactive: <XCircle className="size-3" />,
};

const STATUSES: FacilityStatus[] = ["active", "maintenance", "inactive"];
const SLOT_OPTIONS = [30, 60, 90, 120];
type StatusFilter = "all" | FacilityStatus;

function emptyForm(sportId: string = "") {
  return {
    name: "",
    sport_id: sportId,
    location: "",
    slot_minutes: 60,
    status: "active" as FacilityStatus,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminFacilitiesPage() {
  const qc = useQueryClient();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [form, setForm] = useState(emptyForm());

  const facilitiesQ = useQuery({
    queryKey: ["facilities", { with_availability: true, include_inactive: true }],
    queryFn: () => catalogApi.facilities({ with_availability: true, include_inactive: true }),
  });

  const sportsQ = useQuery({
    queryKey: ["sports"],
    queryFn: () => catalogApi.sports(),
  });

  const createMut = useMutation({
    mutationFn: catalogApi.createFacility,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facilities"] });
      dialogRef.current?.close();
      setForm(emptyForm());
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof catalogApi.updateFacility>[1] }) =>
      catalogApi.updateFacility(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facilities"] });
      dialogRef.current?.close();
      setEditingFacility(null);
      setForm(emptyForm());
    },
  });

  const facilities = facilitiesQ.data ?? [];
  const sports = sportsQ.data ?? [];

  const filtered = facilities.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase());
    const matchSport = sportFilter === "all" || f.sport.id === sportFilter;
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    return matchSearch && matchSport && matchStatus;
  });

  function openCreate() {
    setEditingFacility(null);
    setForm(emptyForm(sports[0]?.id ?? ""));
    dialogRef.current?.showModal();
  }

  function openEdit(facility: Facility) {
    setEditingFacility(facility);
    setForm({
      name: facility.name,
      sport_id: facility.sport.id,
      location: facility.location,
      slot_minutes: facility.slot_minutes,
      status: facility.status,
    });
    dialogRef.current?.showModal();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingFacility) {
      updateMut.mutate({ id: editingFacility.id, body: form });
    } else {
      createMut.mutate(form);
    }
  }

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-label-sm text-on-surface font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-primary-fixed" />
            FACILITIES CATALOG
          </span>
          <h1 className="text-headline-lg font-semibold text-on-surface tracking-tight font-display">
            Facilities Management
          </h1>
          <p className="text-label-lg text-on-surface-variant mt-1">
            Manage courts, pools, and arenas — set status, slots, and availability.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-12 px-5 rounded-xl bg-secondary-container text-on-primary text-headline-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
        >
          <PlusCircle className="size-5" />
          Add Facility
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface text-label-lg placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container shadow-sm"
          />
        </div>

        {/* Sport filter */}
        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container shadow-sm"
        >
          <option value="all">All Sports</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Status pills */}
        <div className="flex items-center gap-2">
          {(["all", ...STATUSES] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "h-9 px-4 rounded-full text-label-md transition-colors capitalize",
                statusFilter === s
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high",
              )}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Facilities grid ── */}
      {facilitiesQ.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-outline-variant p-12 text-center">
          <Building2 className="size-10 text-on-surface-variant mx-auto mb-3 opacity-40" />
          <p className="text-headline-sm text-on-surface-variant">
            {search || sportFilter !== "all" || statusFilter !== "all"
              ? "No facilities match your filters."
              : "No facilities yet. Add your first facility!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((facility) => {
            const openSlots = facility.availability?.open_slots_today ?? 0;
            const nextSlot = facility.availability?.next_slot;
            const totalSlots = 16; // rough daily estimate
            const usedPct = Math.max(0, 1 - openSlots / Math.max(totalSlots, 1));

            return (
              <div
                key={facility.id}
                className={cn(
                  "bg-surface-container-lowest rounded-xl p-5 shadow-sm flex flex-col gap-3 border border-surface-container hover:border-outline-variant transition-colors",
                  facility.status === "inactive" && "opacity-70",
                )}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-headline-sm font-semibold text-on-surface font-display leading-tight truncate">
                      {facility.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-label-sm font-semibold text-on-surface-variant">
                        {facility.sport.name}
                      </span>
                      <span className="text-label-sm text-on-surface-variant">
                        📍 {facility.location}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(facility)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors shrink-0"
                    title="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>

                {/* Status + slot badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold capitalize",
                      STATUS_STYLES[facility.status],
                      facility.status === "maintenance" && "slot-stripes",
                    )}
                  >
                    {STATUS_ICONS[facility.status]}
                    {facility.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-label-sm font-semibold text-on-surface-variant">
                    {facility.slot_minutes} min slots
                  </span>
                </div>

                {/* Availability bar */}
                {facility.status === "active" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm text-on-surface-variant">Open slots today</span>
                      <span className="text-label-sm font-semibold text-on-surface">{openSlots}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary-container transition-all"
                        style={{ width: `${usedPct * 100}%` }}
                      />
                    </div>
                    {nextSlot && (
                      <p className="text-label-sm text-on-surface-variant">
                        Next:{" "}
                        <span className="font-semibold text-on-surface">
                          {new Date(nextSlot.start).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {facility.status === "maintenance" && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container">
                    <AlertTriangle className="size-4 text-warning shrink-0" />
                    <span className="text-label-sm text-on-surface-variant">Facility under maintenance</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Dialog ── */}
      <dialog
        ref={dialogRef}
        className="modal rounded-xl p-0 w-full max-w-lg bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container">
          <h2 className="text-headline-sm font-semibold text-on-surface">
            {editingFacility ? "Edit Facility" : "Add Facility"}
          </h2>
          <button
            onClick={() => dialogRef.current?.close()}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant"
          >
            <XCircle className="size-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Facility Name *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Badminton Court A"
              className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Sport *</label>
            <select
              required
              value={form.sport_id}
              onChange={(e) => setForm((f) => ({ ...f, sport_id: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
            >
              <option value="">Select sport…</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Location *</label>
            <input
              required
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Sports Complex, Block B"
              className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-label-md font-semibold text-on-surface-variant">Slot Duration</label>
              <select
                value={form.slot_minutes}
                onChange={(e) => setForm((f) => ({ ...f, slot_minutes: Number(e.target.value) }))}
                className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                {SLOT_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label-md font-semibold text-on-surface-variant">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FacilityStatus }))}
                className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-surface-container">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-10 px-5 rounded-lg bg-surface-container text-on-surface text-label-lg font-semibold hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-10 px-5 rounded-lg bg-secondary-container text-on-primary text-label-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isPending ? "Saving…" : editingFacility ? "Save Changes" : "Create Facility"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
