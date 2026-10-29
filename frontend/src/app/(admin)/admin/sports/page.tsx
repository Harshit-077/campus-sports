"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusCircle,
  Search,
  Pencil,
  Trash2,
  XCircle,
  Trophy,
  Plus,
  Minus,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { catalogApi } from "@/lib/services";
import { Skeleton } from "@/components/ui/states";
import type { Sport, SportCategory, AttrType, AttributeDef } from "@/lib/types";

// ── Category styles ───────────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<SportCategory, string> = {
  team: "bg-primary-container text-on-primary",
  racquet: "bg-secondary-container text-on-secondary",
  aquatic: "bg-blue-100 text-blue-800",
  fitness: "bg-primary-fixed text-on-primary-fixed",
  individual: "bg-surface-container-highest text-on-surface-variant",
  other: "bg-surface-container-high text-on-surface-variant",
};

const CATEGORIES: SportCategory[] = ["team", "racquet", "aquatic", "fitness", "individual", "other"];
const ATTR_TYPES: AttrType[] = ["string", "number", "boolean", "enum"];

// ── Empty form state ──────────────────────────────────────────────────────────
function emptyForm() {
  return {
    name: "",
    category: "team" as SportCategory,
    description: "",
    attributes: [] as AttributeDef[],
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminSportsPage() {
  const qc = useQueryClient();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const [search, setSearch] = useState("");
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [deleteSport, setDeleteSport] = useState<Sport | null>(null);
  const [form, setForm] = useState(emptyForm());

  const sportsQ = useQuery({
    queryKey: ["sports"],
    queryFn: () => catalogApi.sports(),
  });

  const createMut = useMutation({
    mutationFn: catalogApi.createSport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sports"] });
      dialogRef.current?.close();
      setForm(emptyForm());
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof catalogApi.updateSport>[1] }) =>
      catalogApi.updateSport(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sports"] });
      dialogRef.current?.close();
      setEditingSport(null);
      setForm(emptyForm());
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => catalogApi.deleteSport(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sports"] });
      deleteDialogRef.current?.close();
      setDeleteSport(null);
    },
  });

  const sports = sportsQ.data ?? [];
  const filtered = sports.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditingSport(null);
    setForm(emptyForm());
    dialogRef.current?.showModal();
  }

  function openEdit(sport: Sport) {
    setEditingSport(sport);
    setForm({
      name: sport.name,
      category: sport.category,
      description: sport.description ?? "",
      attributes: sport.attributes,
    });
    dialogRef.current?.showModal();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      name: form.name,
      category: form.category,
      description: form.description || null,
      attributes: form.attributes,
    };
    if (editingSport) {
      updateMut.mutate({ id: editingSport.id, body });
    } else {
      createMut.mutate(body);
    }
  }

  function addAttr() {
    setForm((f) => ({
      ...f,
      attributes: [...f.attributes, { key: "", label: "", type: "string", required: false }],
    }));
  }

  function removeAttr(idx: number) {
    setForm((f) => ({
      ...f,
      attributes: f.attributes.filter((_, i) => i !== idx),
    }));
  }

  function setAttr(idx: number, field: keyof AttributeDef, value: string | boolean) {
    setForm((f) => ({
      ...f,
      attributes: f.attributes.map((a, i) => (i === idx ? { ...a, [field]: value } : a)),
    }));
  }

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-label-sm text-on-surface font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-primary-fixed" />
            SPORTS CATALOG
          </span>
          <h1 className="text-headline-lg font-semibold text-on-surface tracking-tight font-display">
            Sports Management
          </h1>
          <p className="text-label-lg text-on-surface-variant mt-1">
            Define and manage sports, categories and attribute schemas.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-12 px-5 rounded-xl bg-secondary-container text-on-primary text-headline-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
        >
          <PlusCircle className="size-5" />
          Add Sport
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
        <input
          type="text"
          placeholder="Search sports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface text-label-lg placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container shadow-sm"
        />
      </div>

      {/* ── Grid ── */}
      {sportsQ.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-outline-variant p-12 text-center">
          <Trophy className="size-10 text-on-surface-variant mx-auto mb-3 opacity-40" />
          <p className="text-headline-sm text-on-surface-variant">
            {search ? "No sports match your search." : "No sports yet. Add your first sport!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sport) => (
            <div
              key={sport.id}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex flex-col gap-3 border border-surface-container hover:border-outline-variant transition-colors"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-headline-sm font-semibold text-on-surface font-display leading-tight">
                    {sport.name}
                  </h3>
                  <span
                    className={cn(
                      "inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-semibold capitalize",
                      CATEGORY_STYLES[sport.category],
                    )}
                  >
                    {sport.category}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(sport)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
                    title="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteSport(sport);
                      deleteDialogRef.current?.showModal();
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-error-container hover:opacity-80 text-on-error-container transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {sport.description && (
                <p className="text-label-lg text-on-surface-variant line-clamp-2">{sport.description}</p>
              )}

              {/* Attributes */}
              {sport.attributes.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-surface-container">
                  {sport.attributes.slice(0, 4).map((attr) => (
                    <div key={attr.key} className="flex items-center justify-between gap-2">
                      <span className="text-label-sm text-on-surface-variant font-semibold">{attr.label}</span>
                      <span className="text-label-sm text-on-surface bg-surface-container px-2 py-0.5 rounded-full">
                        {attr.type}
                      </span>
                    </div>
                  ))}
                  {sport.attributes.length > 4 && (
                    <p className="text-label-sm text-on-surface-variant">
                      +{sport.attributes.length - 4} more attributes
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Dialog ── */}
      <dialog
        ref={dialogRef}
        className="modal rounded-xl p-0 w-full max-w-xl bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container">
          <h2 className="text-headline-sm font-semibold text-on-surface">
            {editingSport ? "Edit Sport" : "Add Sport"}
          </h2>
          <button
            onClick={() => dialogRef.current?.close()}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant"
          >
            <XCircle className="size-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Sport Name *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Badminton"
              className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as SportCategory }))}
              className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the sport..."
              className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container resize-none"
            />
          </div>

          {/* Attributes builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-label-md font-semibold text-on-surface-variant">
                Attributes
              </label>
              <button
                type="button"
                onClick={addAttr}
                className="h-8 px-3 rounded-lg bg-surface-container text-on-surface text-label-sm font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1"
              >
                <Plus className="size-3.5" />
                Add
              </button>
            </div>
            {form.attributes.length === 0 && (
              <p className="text-label-sm text-on-surface-variant italic">
                No attributes yet. Click "Add" to define sport-specific fields.
              </p>
            )}
            {form.attributes.map((attr, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg bg-surface-container"
              >
                <input
                  type="text"
                  placeholder="key"
                  value={attr.key}
                  onChange={(e) => setAttr(idx, "key", e.target.value)}
                  className="col-span-3 h-8 px-2 rounded-md bg-surface-container-lowest border border-outline-variant text-label-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
                <input
                  type="text"
                  placeholder="label"
                  value={attr.label}
                  onChange={(e) => setAttr(idx, "label", e.target.value)}
                  className="col-span-4 h-8 px-2 rounded-md bg-surface-container-lowest border border-outline-variant text-label-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
                <select
                  value={attr.type}
                  onChange={(e) => setAttr(idx, "type", e.target.value)}
                  className="col-span-3 h-8 px-2 rounded-md bg-surface-container-lowest border border-outline-variant text-label-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                >
                  {ATTR_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div className="col-span-1 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={attr.required}
                    onChange={(e) => setAttr(idx, "required", e.target.checked)}
                    title="Required"
                    className="rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeAttr(idx)}
                  className="col-span-1 h-8 w-8 flex items-center justify-center rounded-md bg-error-container text-on-error-container hover:opacity-80 transition-opacity mx-auto"
                >
                  <Minus className="size-3.5" />
                </button>
              </div>
            ))}
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
              {isPending ? "Saving…" : editingSport ? "Save Changes" : "Create Sport"}
            </button>
          </div>
        </form>
      </dialog>

      {/* ── Delete Confirm Dialog ── */}
      <dialog
        ref={deleteDialogRef}
        className="modal rounded-xl p-0 w-full max-w-sm bg-surface-container-lowest shadow-2xl"
      >
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mx-auto">
            <Trash2 className="size-6 text-on-error-container" />
          </div>
          <div className="text-center">
            <h2 className="text-headline-sm font-semibold text-on-surface">Delete Sport?</h2>
            <p className="text-label-lg text-on-surface-variant mt-1">
              <span className="font-semibold text-on-surface">{deleteSport?.name}</span> will be permanently removed.
              This may affect existing facilities and bookings.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => deleteDialogRef.current?.close()}
              className="flex-1 h-10 rounded-lg bg-surface-container text-on-surface text-label-lg font-semibold hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteSport && deleteMut.mutate(deleteSport.id)}
              disabled={deleteMut.isPending}
              className="flex-1 h-10 rounded-lg bg-error text-on-primary text-label-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
