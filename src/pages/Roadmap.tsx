import { ArrowLeft, Check, Clock, Circle, Gamepad2, ShoppingCart, Users, Rocket, Shield, Palette, MessageSquare, Trophy, Code, Wrench } from "lucide-react";
import Header from "@/components/Header";

type TaskStatus = "completed" | "in-progress" | "planned";

interface Task {
  name: string;
  status: TaskStatus;
  description?: string;
}

interface Phase {
  title: string;
  icon: React.ReactNode;
  color: string;
  tasks: Task[];
}

const phases: Phase[] = [
  {
    title: "Phase 1 — Foundation",
    icon: <Wrench className="h-5 w-5" />,
    color: "hsl(var(--bc-blue))",
    tasks: [
      { name: "User Authentication & Accounts", status: "completed", description: "Registration, login, email verification, password recovery" },
      { name: "Profile System", status: "completed", description: "Customizable profiles with avatars, bios, and social links" },
      { name: "Character Customization", status: "completed", description: "Full avatar editor with body colors, clothing, and accessories" },
      { name: "Forum & Community", status: "completed", description: "Discussion categories, threads, posts, and moderation tools" },
      { name: "Direct Messaging", status: "completed", description: "End-to-end encrypted private messaging between users" },
      { name: "Friends System", status: "completed", description: "Send/accept friend requests, online status tracking" },
      { name: "Admin Panel", status: "completed", description: "User management, content moderation, analytics dashboard" },
      { name: "Mobile Responsive Design", status: "completed", description: "Full mobile support across all pages" },
    ],
  },
  {
    title: "Phase 2 — Economy & Trading",
    icon: <ShoppingCart className="h-5 w-5" />,
    color: "hsl(var(--bc-green))",
    tasks: [
      { name: "Virtual Currency (Coins & Cash)", status: "completed", description: "Dual-currency economy for purchasing items" },
      { name: "Marketplace", status: "completed", description: "Buy and sell user-created items across multiple categories" },
      { name: "Limited Items & Serials", status: "completed", description: "Rare collectibles with unique serial numbers" },
      { name: "Trading System", status: "completed", description: "Peer-to-peer trading of limited items between friends" },
      { name: "Inventory Management", status: "completed", description: "View, equip, and manage owned items" },
      { name: "Currency Purchase (Stripe)", status: "in-progress", description: "Real-money purchases for in-game currency" },
      { name: "User-Created Items", status: "planned", description: "Upload and sell shirts, pants, and t-shirts" },
    ],
  },
  {
    title: "Phase 3 — Games & Creation",
    icon: <Gamepad2 className="h-5 w-5" />,
    color: "hsl(var(--bc-yellow))",
    tasks: [
      { name: "Game Creation System", status: "completed", description: "Create, configure, and publish games" },
      { name: "Game Discovery", status: "completed", description: "Browse, search, and filter community games" },
      { name: "Game Servers", status: "in-progress", description: "Multiplayer server infrastructure" },
      { name: "Game Client (Desktop)", status: "in-progress", description: "Downloadable client for Windows and Mac" },
      { name: "Lua Scripting Engine", status: "planned", description: "In-game scripting for game logic and interactivity" },
      { name: "Studio / Level Editor", status: "planned", description: "Visual editor for building game worlds" },
      { name: "Game Monetization", status: "planned", description: "In-game purchases and developer revenue sharing" },
    ],
  },
  {
    title: "Phase 4 — Platform Growth",
    icon: <Rocket className="h-5 w-5" />,
    color: "hsl(var(--bc-red))",
    tasks: [
      { name: "Groups / Spaces", status: "completed", description: "Create communities with members, roles, and group walls" },
      { name: "Achievements System", status: "completed", description: "Earn badges for milestones and accomplishments" },
      { name: "Blog / News System", status: "completed", description: "Official announcements and community updates" },
      { name: "Advertising System", status: "in-progress", description: "User-created ads to promote games and groups" },
      { name: "Mobile App (iOS & Android)", status: "planned", description: "Native mobile apps for on-the-go gaming" },
      { name: "Developer API", status: "planned", description: "Public API for third-party integrations" },
      { name: "Affiliate & Referral Program", status: "planned", description: "Rewards for inviting new users to the platform" },
      { name: "Localization", status: "planned", description: "Multi-language support for global audiences" },
    ],
  },
];

const statusConfig: Record<TaskStatus, { icon: React.ReactNode; label: string; classes: string }> = {
  completed: { icon: <Check className="h-3.5 w-3.5" />, label: "Done", classes: "bg-[hsl(var(--bc-green))]/10 text-[hsl(var(--bc-green))] border-[hsl(var(--bc-green))]/20" },
  "in-progress": { icon: <Clock className="h-3.5 w-3.5" />, label: "In Progress", classes: "bg-[hsl(var(--bc-yellow))]/10 text-[hsl(var(--bc-yellow))] border-[hsl(var(--bc-yellow))]/20" },
  planned: { icon: <Circle className="h-3.5 w-3.5" />, label: "Planned", classes: "bg-muted text-muted-foreground border-border" },
};

const Roadmap = () => {
  const allTasks = phases.flatMap((p) => p.tasks);
  const completed = allTasks.filter((t) => t.status === "completed").length;
  const inProgress = allTasks.filter((t) => t.status === "in-progress").length;
  const planned = allTasks.filter((t) => t.status === "planned").length;
  const progress = Math.round((completed / allTasks.length) * 100);

  return (
    <div className="has-header">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </a>

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Development Roadmap</h1>
          <p className="mt-3 text-lg text-muted-foreground">Follow our journey as we rebuild BLOX City from the ground up</p>
        </div>

        {/* Progress Overview */}
        <div className="mb-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Overall Progress</span>
            <span className="text-2xl font-extrabold text-primary">{progress}%</span>
          </div>
          <div className="mb-4 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--bc-green))] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--bc-green))]">{completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--bc-yellow))]">{inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">{planned}</p>
              <p className="text-xs text-muted-foreground">Planned</p>
            </div>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-8">
          {phases.map((phase, i) => {
            const phaseCompleted = phase.tasks.filter((t) => t.status === "completed").length;
            const phaseProgress = Math.round((phaseCompleted / phase.tasks.length) * 100);

            return (
              <div key={i} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Phase header */}
                <div className="flex items-center gap-4 border-b border-border bg-muted/30 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: phase.color }}>
                    {phase.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-foreground">{phase.title}</h2>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${phaseProgress}%`, background: phase.color }} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{phaseProgress}%</span>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="divide-y divide-border">
                  {phase.tasks.map((task, j) => {
                    const cfg = statusConfig[task.status];
                    return (
                      <div key={j} className="flex items-start gap-4 px-5 py-4 transition hover:bg-muted/30">
                        <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border ${cfg.classes}`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${task.status === "completed" ? "text-foreground" : task.status === "in-progress" ? "text-foreground" : "text-muted-foreground"}`}>
                            {task.name}
                          </p>
                          {task.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
                          )}
                        </div>
                        <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="mt-16 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          © 2026 BLOX City, Inc. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Roadmap;
