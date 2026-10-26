import { Suspense } from "react";

import { FacilityDetail } from "./facility-detail";

export default function FacilityDetailsPage() {
  return (
    <Suspense>
      <FacilityDetail />
    </Suspense>
  );
}
