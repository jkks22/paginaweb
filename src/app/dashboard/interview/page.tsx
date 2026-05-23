"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User, Lock } from "lucide-react";
import Link from "next/link";

type Message = { role: "user" | "assistant"; content: string };

export default function InterviewPage() {
  const [targetRole, setTargetRole] = useState("");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [isPremiumError, setIsPremiumError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startSession() {
    if (!targetRole.trim()) return;
    setLoading(true);
    setStarted(true);

    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetRole, language }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 403) setIsPremiumError(true);
      setLoading(false);
      setStarted(false);
      return;
    }

    setSessionId(data.sessionId);
    setMessages(data.messages);
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        targetRole,
        language,
        userMessage: userMsg,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessages(data.messages);
    }

    setLoading(false);
  }

  if (isPremiumError) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Premium feature</h2>
        <p className="text-muted-foreground">
          The interview simulator is available on the Premium plan. Upgrade to
          practice unlimited interviews.
        </p>
        <Link href="/#pricing">
          <Button className="w-full">Upgrade to Premium — $9/month</Button>
        </Link>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-lg mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">
            {language === "es" ? "Simulador de Entrevista" : "Interview Simulator"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "es"
              ? "Practica con preguntas generadas por IA para tu rol objetivo"
              : "Practice with AI-generated questions tailored to your target role"}
          </p>
        </div>

        <div className="flex gap-2">
          {(["en", "es"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                language === lang
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {lang === "en" ? "English" : "Español"}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">
            {language === "es" ? "Puesto objetivo" : "Target role"}
          </Label>
          <Input
            id="role"
            placeholder={
              language === "es"
                ? "ej. Software Engineer, Product Manager..."
                : "e.g. Software Engineer, Product Manager..."
            }
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startSession()}
          />
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              {language === "es"
                ? "Alex, tu entrevistador de IA, te hará preguntas técnicas y de comportamiento. Responde como lo harías en una entrevista real. Recibirás feedback después de cada respuesta."
                : "Alex, your AI interviewer, will ask technical and behavioral questions. Answer as you would in a real interview. You'll receive feedback after each response."}
            </p>
          </CardContent>
        </Card>

        <Button
          onClick={startSession}
          disabled={!targetRole.trim() || loading}
          className="w-full"
          size="lg"
        >
          {loading
            ? language === "es"
              ? "Iniciando sesión..."
              : "Starting session..."
            : language === "es"
            ? "Iniciar entrevista"
            : "Start interview"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              AI
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">Alex</p>
            <p className="text-xs text-muted-foreground">AI Interviewer</p>
          </div>
        </div>
        <Badge variant="outline">{targetRole}</Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-secondary text-xs">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder={
              language === "es" ? "Tu respuesta..." : "Your answer..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="resize-none min-h-[44px] max-h-32"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="icon"
            className="shrink-0 h-auto"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {language === "es" ? "Enter para enviar" : "Enter to send"}
        </p>
      </div>
    </div>
  );
}
