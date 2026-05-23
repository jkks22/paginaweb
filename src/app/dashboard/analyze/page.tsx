"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

type AnalysisResult = {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: Array<{ area: string; issue: string; suggestion: string }>;
  sections: Record<string, { score: number; feedback: string }>;
  keywordsForRole: string[];
  estimatedYearsExperience: number;
};

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("cv", file);
    formData.append("targetRole", targetRole);
    formData.append("language", language);

    const res = await fetch("/api/analyze-cv", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    setResult(data.result);
    setLoading(false);
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-500";
  };

  const scoreLabel = (score: number, lang: "en" | "es") => {
    if (lang === "es") {
      if (score >= 80) return "Excelente";
      if (score >= 60) return "Bueno";
      if (score >= 40) return "Regular";
      return "Necesita mejoras";
    }
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs work";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          {language === "es" ? "Analizar mi CV" : "Analyze my CV"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === "es"
            ? "Sube tu CV en PDF y obtén feedback detallado con IA"
            : "Upload your CV as PDF and get detailed AI-powered feedback"}
        </p>
      </div>

      {!result && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Language toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                language === "en"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("es")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                language === "es"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Español
            </button>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : file
                ? "border-green-400 bg-green-50"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-green-500" />
                <p className="font-medium text-green-700">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB —{" "}
                  <span
                    className="text-primary cursor-pointer underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    {language === "es" ? "cambiar" : "change"}
                  </span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="w-10 h-10" />
                <p className="font-medium">
                  {language === "es"
                    ? "Arrastra tu CV aquí o haz clic para seleccionar"
                    : "Drag your CV here or click to select"}
                </p>
                <p className="text-sm">PDF, max 5MB</p>
              </div>
            )}
          </div>

          {/* Target role */}
          <div className="space-y-1.5">
            <Label htmlFor="role">
              {language === "es"
                ? "Puesto objetivo (opcional)"
                : "Target role (optional)"}
            </Label>
            <Input
              id="role"
              placeholder={
                language === "es"
                  ? "ej. Desarrollador Frontend, Product Manager..."
                  : "e.g. Frontend Developer, Product Manager..."
              }
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!file || loading}
          >
            {loading
              ? language === "es"
                ? "Analizando tu CV..."
                : "Analyzing your CV..."
              : language === "es"
              ? "Analizar CV"
              : "Analyze CV"}
          </Button>
        </form>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Score hero */}
          <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div
                    className={`text-6xl font-bold ${scoreColor(
                      result.overallScore
                    )}`}
                  >
                    {result.overallScore}
                  </div>
                  <div className="text-sm text-muted-foreground">/100</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        result.overallScore >= 80 ? "default" : "secondary"
                      }
                    >
                      {scoreLabel(result.overallScore, language)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ~{result.estimatedYearsExperience}{" "}
                      {language === "es"
                        ? "años de experiencia"
                        : "years of experience"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{result.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="overview">
                {language === "es" ? "Resumen" : "Overview"}
              </TabsTrigger>
              <TabsTrigger value="sections">
                {language === "es" ? "Secciones" : "Sections"}
              </TabsTrigger>
              <TabsTrigger value="improvements">
                {language === "es" ? "Mejoras" : "Improvements"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {language === "es" ? "Fortalezas" : "Strengths"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Keywords */}
              {result.keywordsForRole.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      {language === "es"
                        ? "Keywords clave para el rol"
                        : "Key role keywords"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.keywordsForRole.map((kw) => (
                        <Badge key={kw} variant="outline">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sections" className="space-y-3 mt-4">
              {Object.entries(result.sections).map(([section, data]) => (
                <Card key={section}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium capitalize">{section}</span>
                      <span
                        className={`font-bold ${scoreColor(data.score)}`}
                      >
                        {data.score}/100
                      </span>
                    </div>
                    <Progress value={data.score} className="h-2 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {data.feedback}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="improvements" className="space-y-3 mt-4">
              {result.improvements.map((imp, i) => (
                <Card key={i} className="border-l-4 border-l-yellow-400">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{imp.area}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {imp.issue}
                    </p>
                    <p className="text-sm text-primary font-medium">
                      {language === "es" ? "Sugerencia: " : "Suggestion: "}
                      {imp.suggestion}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
              className="flex-1"
            >
              {language === "es" ? "Analizar otro CV" : "Analyze another CV"}
            </Button>
            <Button
              onClick={() => (window.location.href = "/dashboard/interview")}
              className="flex-1"
            >
              {language === "es"
                ? "Practicar entrevista"
                : "Practice interview"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
