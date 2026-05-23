import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MessageSquare, History, LogOut, Crown } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan, analyses_used, analyses_limit")
    .eq("id", user.id)
    .single();

  const initials = (profile?.full_name || user.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { href: "/dashboard/analyze", label: "Analyze CV", icon: FileText },
    { href: "/dashboard/interview", label: "Interview", icon: MessageSquare },
    { href: "/dashboard/history", label: "History", icon: History },
  ];

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-primary">
              CVwise
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {profile?.plan === "free" && (
              <Link href="/#pricing">
                <Button size="sm" variant="outline" className="gap-1.5 hidden sm:flex">
                  <Crown className="w-3.5 h-3.5" />
                  Upgrade
                </Button>
              </Link>
            )}
            {profile?.plan === "premium" && (
              <Badge className="gap-1">
                <Crown className="w-3 h-3" />
                Premium
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">
                    {profile?.full_name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.plan === "free"
                      ? `${profile.analyses_used}/${profile.analyses_limit} analyses used`
                      : "Premium — unlimited"}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <button type="submit" className="flex items-center gap-2 w-full">
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden border-b bg-white">
        <div className="flex px-4 gap-1 py-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
