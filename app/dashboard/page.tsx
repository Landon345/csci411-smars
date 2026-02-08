import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function DashboardRedirect() {
  const user = await getSession();
  if (!user) redirect("/login");

  switch (user.Role) {
    case "patient":
      redirect("/patient/dashboard");
    case "doctor":
      redirect("/doctor/dashboard");
    case "admin":
      redirect("/admin/dashboard");
    default:
      redirect("/login");
  }
}
