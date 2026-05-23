import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp } from "lucide-react";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: analyses } = await supabase
    .from("cv_analyses")
    .select("id, cv_filename, target_role, overall_score, language, created_at, analysis_result")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-500";
  };

  const scoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs work";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analysis history</h1>
        <p className="text-muted-foreground">
          All your CV analyses — {analyses?.length ?? 0} total
        </p>
      </div>

      {analyses && analyses.length > 0 ? (
        <div className="space-y-4">
          {analyses.map((a) => {
            const result = a.analysis_result as {
              summary?: string;
              strengths?: string[];
            };
            return (
              <Card key={a.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-medium truncate">{a.cv_filename}</p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {a.language.toUpperCase()}
                        </Badge>
                        {a.target_role && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {a.target_role}
                          </Badge>
                        )}
                      </div>
                      {result.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {result.summary}
                        </p>
                      )}
                      {result.strengths && result.strengths.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Top strength:</span>{" "}
                          {result.strengths[0]}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(a.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-3xl font-bold ${scoreColor(a.overall_score)}`}>
                        {a.overall_score}
                      </p>
                      <p className="text-xs text-muted-foreground">/100</p>
                      <p className={`text-xs font-medium mt-0.5 ${scoreColor(a.overall_score)}`}>
                        {scoreLabel(a.overall_score)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium mb-1">No analyses yet</p>
            <p className="text-sm text-muted-foreground">
              Your CV analysis history will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
