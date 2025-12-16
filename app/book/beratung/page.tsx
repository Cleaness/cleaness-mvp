import { Suspense } from "react";
import BeratungSlotsClient from "./slots-client";

export default function Page() {
  return (
    <Suspense>
      <BeratungSlotsClient />
    </Suspense>
  );
}
