import { Suspense } from "react";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  // useSearchParams (used by the form) must sit under a Suspense boundary.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
