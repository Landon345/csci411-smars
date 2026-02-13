import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PatientDashboard() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">
          Welcome back,{" "}
          <span className="text-muted-foreground">
            {user.FirstName} {user.LastName}
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          You have successfully authenticated into your medical portal.
        </p>
      </header>

      <Card className="mb-6">
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your session is active and encrypted.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: "Heart Rate", value: "72 bpm", status: "Normal" },
          { label: "Blood Pressure", value: "120/80", status: "Optimal" },
          { label: "Sleep Quality", value: "8h 12m", status: "Good" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-medium">
                {stat.value}
              </p>
              <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {stat.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No recent records to display.
        </CardContent>
      </Card>
    </>
  );
}
