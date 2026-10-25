"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AuthLayout } from "@/app/auth-layout";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { status, user, register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", email: "", password: "", student_id: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && user) router.replace(homeFor(user.role));
  }, [status, user, router]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email.trim(),
        password: form.password,
        student_id: form.student_id.trim() || undefined,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = err.fieldErrors();
        if (err.code === "EMAIL_TAKEN") fields.email = err.message;
        setFieldErrors(fields);
        if (Object.keys(fields).length === 0) setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Students can book facilities right away.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full name" autoComplete="name" required value={form.name} onChange={set("name")} error={fieldErrors.name} />
        <Field label="Email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} error={fieldErrors.email} />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={set("password")}
          error={fieldErrors.password}
          hint="At least 8 characters."
        />
        <Field label="Student ID (optional)" value={form.student_id} onChange={set("student_id")} error={fieldErrors.student_id} />
        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" variant="accent" size="lg" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-brand underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
