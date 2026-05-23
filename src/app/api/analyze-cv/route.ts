import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, analyses_used, analyses_limit")
    .eq("id", user.id)
    .single();

  if (profile && profile.analyses_used >= profile.analyses_limit && profile.plan === "free") {
    return NextResponse.json(
      { error: "Free plan limit reached. Upgrade to Premium for unlimited analyses." },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("cv") as File;
  const targetRole = formData.get("targetRole") as string;
  const language = (formData.get("language") as string) || "en";

  if (!file) {
    return NextResponse.json({ error: "No CV file provided" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const storagePath = `${user.id}/${Date.now()}_${file.name}`;
  await supabase.storage.from("cvs").upload(storagePath, arrayBuffer, {
    contentType: file.type,
    upsert: false,
  });

  const systemPrompt =
    language === "es"
      ? `Eres un experto en recursos humanos y reclutamiento con más de 15 años de experiencia revisando CVs para empresas de tecnología, finanzas y startups. Analiza el CV proporcionado de forma detallada, objetiva y constructiva. Responde siempre en español. Tu respuesta debe ser un JSON válido con la estructura especificada.`
      : `You are an expert HR professional and recruiter with 15+ years of experience reviewing CVs for tech companies, finance firms, and startups. Analyze the provided CV in a detailed, objective, and constructive manner. Respond in English. Your response must be valid JSON with the specified structure.`;

  const analysisPrompt =
    language === "es"
      ? `Analiza este CV${targetRole ? ` para el puesto de "${targetRole}"` : ""} y devuelve un JSON con exactamente esta estructura:
{
  "overallScore": <número del 0 al 100>,
  "summary": "<resumen ejecutivo de 2-3 oraciones del candidato>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>", "<fortaleza 3>"],
  "improvements": [
    {
      "area": "<nombre del área>",
      "issue": "<descripción del problema>",
      "suggestion": "<sugerencia específica de mejora>"
    }
  ],
  "sections": {
    "experience": { "score": <0-100>, "feedback": "<feedback>" },
    "education": { "score": <0-100>, "feedback": "<feedback>" },
    "skills": { "score": <0-100>, "feedback": "<feedback>" },
    "formatting": { "score": <0-100>, "feedback": "<feedback>" }
  },
  "keywordsForRole": ["<keyword relevante 1>", "<keyword relevante 2>"],
  "estimatedYearsExperience": <número>
}`
      : `Analyze this CV${targetRole ? ` for the position of "${targetRole}"` : ""} and return JSON with exactly this structure:
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence executive summary of the candidate>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": [
    {
      "area": "<area name>",
      "issue": "<description of the issue>",
      "suggestion": "<specific improvement suggestion>"
    }
  ],
  "sections": {
    "experience": { "score": <0-100>, "feedback": "<feedback>" },
    "education": { "score": <0-100>, "feedback": "<feedback>" },
    "skills": { "score": <0-100>, "feedback": "<feedback>" },
    "formatting": { "score": <0-100>, "feedback": "<feedback>" }
  },
  "keywordsForRole": ["<relevant keyword 1>", "<relevant keyword 2>"],
  "estimatedYearsExperience": <number>
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: file.type as "application/pdf",
              data: base64,
            },
          },
          { type: "text", text: analysisPrompt },
        ],
      },
    ],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json(
      { error: "Failed to parse AI response" },
      { status: 500 }
    );
  }

  const analysisResult = JSON.parse(jsonMatch[0]);

  const { data: analysis } = await supabase
    .from("cv_analyses")
    .insert({
      user_id: user.id,
      cv_filename: file.name,
      cv_storage_path: storagePath,
      target_role: targetRole || null,
      language,
      analysis_result: analysisResult,
      overall_score: analysisResult.overallScore,
    })
    .select()
    .single();

  await supabase
    .from("profiles")
    .update({ analyses_used: (profile?.analyses_used ?? 0) + 1 })
    .eq("id", user.id);

  return NextResponse.json({ analysis, result: analysisResult });
}
