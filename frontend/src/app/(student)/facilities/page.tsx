import { Suspense } from "react";

import { FacilitiesView } from "./facilities-view";

export default function FacilitiesPage() {
  // useSearchParams (used by the view) must sit under a Suspense boundary.
  return (
    <Suspense>
      <FacilitiesView />
    </Suspense>
  );
}
