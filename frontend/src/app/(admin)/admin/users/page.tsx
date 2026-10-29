"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
  Download,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { adminApi } from "@/lib/services";
import { Skeleton } from "@/components/ui/states";
import type { Role, User } from "@/lib/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatJoined(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

type RoleFilter = "all" | Role;
const LIMIT = 25;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const qc = useQueryClient();
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [skip, setSkip] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{
    user: User;
    type: "toggle_active" | "toggle_role";
  } | null>(null);

  const params = {
    ...(q.trim() ? { q: q.trim() } : {}),
    ...(roleFilter !== "all" ? { role: roleFilter } : {}),
    ...(activeFilter !== undefined ? { is_active: activeFilter } : {}),
    limit: LIMIT,
    skip,
  };

  const usersQ = useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminApi.users(params),
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof adminApi.updateUser>[1];
    }) => adminApi.updateUser(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      confirmDialogRef.current?.close();
      setConfirmAction(null);
    },
  });

  const data = usersQ.data;
  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(skip / LIMIT) + 1;

  function confirmAndExecute() {
    if (!confirmAction) return;
    const { user, type } = confirmAction;
    if (type === "toggle_active") {
      updateMut.mutate({ id: user.id, body: { is_active: !user.is_active } });
    } else {
      updateMut.mutate({ id: user.id, body: { role: user.role === "admin" ? "student" : "admin" } });
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-label-sm text-on-surface font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-primary-fixed" />
            USER MANAGEMENT
          </span>
          <h1 className="text-headline-lg font-semibold text-on-surface tracking-tight font-display">
            User Management
          </h1>
          <p className="text-label-lg text-on-surface-variant mt-1">
            Manage student accounts, roles, and access permissions.
          </p>
        </div>
        <button
          onClick={() => alert("Export not yet wired to backend")}
          className="h-12 px-5 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface text-headline-sm font-semibold flex items-center gap-2 hover:bg-surface-container transition-colors shadow-sm shrink-0"
        >
          <Download className="size-5" />
          Export Users
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name, email, student ID..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setSkip(0); }}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        </div>

        {/* Role pills */}
        <div className="flex items-center gap-2">
          {([
            { label: "All Users", value: "all" as const },
            { label: "Students", value: "student" as const },
            { label: "Admins", value: "admin" as const },
          ] satisfies { label: string; value: RoleFilter }[]).map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setRoleFilter(tab.value); setSkip(0); }}
              className={cn(
                "h-9 px-4 rounded-full text-label-md transition-colors",
                roleFilter === tab.value
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active toggle */}
        <button
          onClick={() => {
            setActiveFilter((prev) =>
              prev === undefined ? true : prev === true ? false : undefined,
            );
            setSkip(0);
          }}
          className={cn(
            "h-9 px-4 rounded-full text-label-md transition-colors flex items-center gap-1.5",
            activeFilter === true
              ? "bg-primary-fixed text-on-primary-fixed"
              : activeFilter === false
                ? "bg-error-container text-on-error-container"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high",
          )}
        >
          <span className={cn(
            "w-2 h-2 rounded-full",
            activeFilter === true ? "bg-on-primary-fixed" : activeFilter === false ? "bg-on-error-container" : "bg-outline-variant",
          )} />
          {activeFilter === undefined ? "Any Status" : activeFilter ? "Active" : "Inactive"}
        </button>

        <span className="ml-auto text-label-sm text-on-surface-variant">
          {total} users
        </span>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-container">
                <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">User</th>
                <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">Student ID</th>
                <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">Role</th>
                <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">Status</th>
                <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">Joined</th>
                <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersQ.isPending ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-2 px-4">
                      <Skeleton className="h-10" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-on-surface-variant text-label-lg">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      "border-b border-surface-container hover:bg-surface-container-low/50 transition-colors",
                      !user.is_active && "opacity-60",
                    )}
                  >
                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-label-sm font-semibold shrink-0",
                            user.role === "admin"
                              ? "bg-secondary-container text-on-secondary"
                              : "bg-primary-container text-on-primary",
                          )}
                        >
                          {initials(user.name)}
                        </div>
                        <div>
                          <p className="text-label-lg font-semibold text-on-surface leading-tight">
                            {user.name}
                          </p>
                          <p className="text-label-sm text-on-surface-variant">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Student ID */}
                    <td className="py-3.5 px-4">
                      <span className="text-label-lg text-on-surface-variant font-mono">
                        {user.student_id ?? "—"}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold capitalize",
                          user.role === "admin"
                            ? "bg-secondary-container text-on-secondary"
                            : "bg-surface-container-highest text-on-surface-variant",
                        )}
                      >
                        {user.role === "admin" ? <ShieldCheck className="size-3" /> : <Users className="size-3" />}
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-label-lg">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            user.is_active ? "bg-success" : "bg-outline-variant",
                          )}
                        />
                        <span className={user.is_active ? "text-on-surface" : "text-on-surface-variant"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="py-3.5 px-4">
                      <span className="text-label-lg text-on-surface-variant">
                        {formatJoined(user.created_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {/* Toggle active */}
                        <button
                          onClick={() => {
                            setConfirmAction({ user, type: "toggle_active" });
                            confirmDialogRef.current?.showModal();
                          }}
                          title={user.is_active ? "Deactivate" : "Activate"}
                          className={cn(
                            "h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
                            user.is_active
                              ? "bg-error-container text-on-error-container hover:opacity-80"
                              : "bg-primary-fixed text-on-primary-fixed hover:opacity-80",
                          )}
                        >
                          {user.is_active ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                        </button>

                        {/* Toggle role */}
                        <button
                          onClick={() => {
                            setConfirmAction({ user, type: "toggle_role" });
                            confirmDialogRef.current?.showModal();
                          }}
                          title={user.role === "admin" ? "Demote to Student" : "Promote to Admin"}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
                        >
                          {user.role === "admin" ? (
                            <ShieldOff className="size-3.5" />
                          ) : (
                            <ShieldCheck className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-container bg-surface-container-low/50">
            <span className="text-label-sm text-on-surface-variant">
              Page {currentPage} of {totalPages} · {total} users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSkip(Math.max(0, skip - LIMIT))}
                disabled={skip === 0}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setSkip(skip + LIMIT)}
                disabled={skip + LIMIT >= total}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm Dialog ── */}
      <dialog
        ref={confirmDialogRef}
        className="modal rounded-xl p-0 w-full max-w-sm bg-surface-container-lowest shadow-2xl"
      >
        {confirmAction && (
          <div className="p-6 space-y-4">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mx-auto",
                confirmAction.type === "toggle_active"
                  ? confirmAction.user.is_active
                    ? "bg-error-container"
                    : "bg-primary-fixed"
                  : "bg-surface-container-high",
              )}
            >
              {confirmAction.type === "toggle_active" ? (
                confirmAction.user.is_active ? (
                  <UserX className="size-6 text-on-error-container" />
                ) : (
                  <UserCheck className="size-6 text-on-primary-fixed" />
                )
              ) : confirmAction.user.role === "admin" ? (
                <ShieldOff className="size-6 text-on-surface-variant" />
              ) : (
                <ShieldCheck className="size-6 text-on-surface-variant" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-headline-sm font-semibold text-on-surface">
                {confirmAction.type === "toggle_active"
                  ? confirmAction.user.is_active
                    ? "Deactivate User?"
                    : "Activate User?"
                  : confirmAction.user.role === "admin"
                    ? "Demote to Student?"
                    : "Promote to Admin?"}
              </h2>
              <p className="text-label-lg text-on-surface-variant mt-1">
                {confirmAction.type === "toggle_active"
                  ? confirmAction.user.is_active
                    ? `${confirmAction.user.name} will lose access to the platform.`
                    : `${confirmAction.user.name} will regain access.`
                  : confirmAction.user.role === "admin"
                    ? `${confirmAction.user.name} will lose admin privileges.`
                    : `${confirmAction.user.name} will gain full admin access.`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  confirmDialogRef.current?.close();
                  setConfirmAction(null);
                }}
                className="flex-1 h-10 rounded-lg bg-surface-container text-on-surface text-label-lg font-semibold hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndExecute}
                disabled={updateMut.isPending}
                className="flex-1 h-10 rounded-lg bg-secondary-container text-on-primary text-label-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {updateMut.isPending ? "Updating…" : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
