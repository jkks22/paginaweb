import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Message = { role: "user" | "assistant"; content: string };

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
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "free") {
    return NextResponse.json(
      { error: "Interview simulator is a Premium feature. Upgrade to access it." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    sessionId,
    targetRole,
    language = "en",
    userMessage,
    cvSummary,
  } = body;

  const systemPrompt =
    language === "es"
      ? `Eres un entrevistador experto y empático llamado "Alex". Estás entrevistando a un candidato para el puesto de "${targetRole}".
${cvSummary ? `Contexto del candidato basado en su CV: ${cvSummary}` : ""}

Reglas:
- Haz UNA pregunta a la vez. Nunca hagas varias preguntas seguidas.
- Después de la respuesta del candidato, da feedback breve (1-2 oraciones) sobre su respuesta, luego haz la siguiente pregunta.
- Mezcla preguntas técnicas, de comportamiento (STAR) y situacionales según el rol.
- Sé profesional pero amigable.
- Responde siempre en español.
- Empieza presentándote y con una pregunta de calentamiento ("Cuéntame sobre ti").`
      : `You are an expert and empathetic interviewer named "Alex". You are interviewing a candidate for the role of "${targetRole}".
${cvSummary ? `Candidate context from their CV: ${cvSummary}` : ""}

Rules:
- Ask ONE question at a time. Never ask multiple questions in a row.
- After the candidate's answer, give brief feedback (1-2 sentences) on their response, then ask the next question.
- Mix technical, behavioral (STAR), and situational questions appropriate for the role.
- Be professional but friendly.
- Respond in English.
- Start by introducing yourself and asking a warm-up question ("Tell me about yourself").`;

  let messages: Message[] = [];

  if (sessionId) {
    const { data: session } = await supabase
      .from("interview_sessions")
      .select("messages")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (session) {
      messages = session.messages as Message[];
    }
  }

  if (userMessage) {
    messages.push({ role: "user", content: userMessage });
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages:
      messages.length > 0
        ? messages
        : [{ role: "user", content: language === "es" ? "Hola, estoy listo para la entrevista." : "Hello, I'm ready for the interview." }],
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";

  messages.push({ role: "assistant", content: assistantMessage });

  let currentSessionId = sessionId;

  if (!sessionId) {
    const { data: newSession } = await supabase
      .from("interview_sessions")
      .insert({
        user_id: user.id,
        target_role: targetRole,
        language,
        messages,
        status: "active",
      })
      .select("id")
      .single();

    currentSessionId = newSession?.id;
  } else {
    await supabase
      .from("interview_sessions")
      .update({ messages, updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", user.id);
  }

  return NextResponse.json({
    sessionId: currentSessionId,
    message: assistantMessage,
    messages,
  });
}
