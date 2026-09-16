import type { Metadata } from "next";

import { ScenarioDashboard } from "@/components/dashboard/ScenarioDashboard";
import { profiles, simulatorCountries, supplierData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Scenario Lab | ARISE",
  description:
    "Explore how supplier disruptions can affect ASEAN rice import exposure.",
};

export default function DashboardPage() {
  return (
    <ScenarioDashboard
      countries={simulatorCountries}
      profiles={profiles}
      supplierData={supplierData}
    />
  );
}
