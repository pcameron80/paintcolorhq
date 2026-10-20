import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { checkAdminSession } from "@/lib/admin-auth";
import { getLiveData } from "@/lib/admin-analytics";
import type { LiveResponse } from "@/lib/admin-analytics-types";
import { LiveDashboard } from "@/components/admin/live-dashboard";

export const metadata: Metadata = {
  title: "Live",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLivePage() {
  const check = await checkAdminSession();
  if (check === "anonymous") redirect("/auth/login?next=/admin/live");
  if (check === "forbidden") notFound();

  const initial = (await getLiveData("all")) as LiveResponse;
  return <LiveDashboard initial={initial} />;
}
