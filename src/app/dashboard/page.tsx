import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, TrendingUp, Crown } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: recentAnalyses }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, plan, analyses_used, analyses_limit")
      .eq("id", user.id)
      .single(),
    supabase
      .from("cv_analyses")
      .select("id, cv_filename, target_role, overall_score, language, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const name = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {name}</h1>
        <p className="text-muted-foreground">
          {profile?.plan === "free"
            ? `Free plan — ${profile.analyses_used}/${profile.analyses_limit} CV analyses used this month`
            : "Premium plan — unlimited analyses & interviews"}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Analyze my CV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Upload your CV and get an AI-powered score with detailed feedback and improvement suggestions.
            </p>
            <Link href="/dashboard/analyze">
              <Button className="w-full">Start analysis</Button>
            </Link>
          </CardContent>
        </Card>

        <Card
          className={
            profile?.plan === "free"
              ? "opacity-75 relative overflow-hidden"
              : "border-primary/20 hover:border-primary/40 transition-colors"
          }
        >
          {profile?.plan === "free" && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="gap-1 text-xs">
                <Crown className="w-3 h-3" />
                Premium
              </Badge>
            </div>
          )}
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Practice interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Practice with an AI interviewer. Get real-time feedback on your answers.
            </p>
            {profile?.plan === "free" ? (
              <Link href="/#pricing">
                <Button variant="outline" className="w-full gap-1.5">
                  <Crown className="w-4 h-4" />
                  Upgrade to unlock
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard/interview">
                <Button className="w-full">Start interview</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent analyses */}
      {recentAnalyses && recentAnalyses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent analyses</h2>
            <Link
              href="/dashboard/history"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentAnalyses.map((a) => (
              <Card key={a.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {a.cv_filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.target_role || "No target role"} ·{" "}
                        {new Date(a.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-lg font-bold ${
                          a.overall_score >= 80
                            ? "text-green-600"
                            : a.overall_score >= 60
                            ? "text-yellow-600"
                            : "text-red-500"
                        }`}
                      >
                        {a.overall_score}
                      </p>
                      <p className="text-xs text-muted-foreground">/100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {recentAnalyses?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              No analyses yet. Upload your first CV to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
