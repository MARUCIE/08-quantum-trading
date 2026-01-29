"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LineChart,
  FlaskConical,
  CandlestickChart,
  Shield,
  Settings,
  Users,
  Bell,
  FileText,
  Key,
  SlidersHorizontal,
  Layers,
  PieChart,
  BookOpen,
  Grid3X3,
  Calculator,
  GitCompare,
  BarChart2,
  CalendarDays,
  Radio,
  Scan,
  Eye,
  CalendarCheck,
  BarChart,
  PlayCircle,
  Brain,
  Sparkles,
  Wand2,
  TestTube,
  Building2,
  ArrowUpDown,
  Route,
  Zap,
  Server,
  Globe,
  Activity,
  LayoutGrid,
  Wallet,
  Trophy,
  Store,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Navigation item type
interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
}

// Navigation group type
interface NavGroup {
  key: string;
  icon: LucideIcon;
  items: NavItem[];
}

// Core items always visible (not collapsible)
const coreNavigation: NavItem[] = [
  { key: "overview", href: "/", icon: LayoutDashboard },
  { key: "trading", href: "/trading", icon: CandlestickChart },
  { key: "strategies", href: "/strategies", icon: FlaskConical },
];

// Grouped navigation
const navGroups: NavGroup[] = [
  {
    key: "analysis",
    icon: LineChart,
    items: [
      { key: "backtest", href: "/backtest", icon: LineChart },
      { key: "optimizer", href: "/optimizer", icon: SlidersHorizontal },
      { key: "mtfAnalysis", href: "/mtf", icon: Layers },
      { key: "correlation", href: "/correlation", icon: Grid3X3 },
      { key: "attribution", href: "/attribution", icon: BarChart },
      { key: "compare", href: "/compare", icon: GitCompare },
    ],
  },
  {
    key: "portfolio",
    icon: Wallet,
    items: [
      { key: "portfolio", href: "/portfolio-analytics", icon: Wallet },
      { key: "accounts", href: "/accounts", icon: Key },
      { key: "risk", href: "/risk", icon: Shield },
      { key: "allocation", href: "/allocation", icon: PieChart },
      { key: "positionSizing", href: "/position-sizing", icon: Calculator },
      { key: "pnlCalendar", href: "/pnl-calendar", icon: CalendarDays },
      { key: "journal", href: "/journal", icon: BookOpen },
      { key: "tradeStats", href: "/trade-stats", icon: BarChart },
    ],
  },
  {
    key: "markets",
    icon: TrendingUp,
    items: [
      { key: "orderBook", href: "/orderbook", icon: BarChart2 },
      { key: "signals", href: "/signals", icon: Radio },
      { key: "scanner", href: "/scanner", icon: Scan },
      { key: "watchlist", href: "/watchlist", icon: Eye },
      { key: "calendar", href: "/calendar", icon: CalendarCheck },
      { key: "replay", href: "/replay", icon: PlayCircle },
    ],
  },
  {
    key: "aiTools",
    icon: Brain,
    items: [
      { key: "mlModels", href: "/ml-models", icon: Brain },
      { key: "features", href: "/feature-importance", icon: Sparkles },
      { key: "generator", href: "/strategy-generator", icon: Wand2 },
      { key: "mlBacktest", href: "/model-backtest", icon: TestTube },
    ],
  },
  {
    key: "exchanges",
    icon: Building2,
    items: [
      { key: "exchanges", href: "/exchanges", icon: Building2 },
      { key: "exchangeCompare", href: "/exchange-compare", icon: ArrowUpDown },
      { key: "routing", href: "/smart-routing", icon: Route },
      { key: "arbitrage", href: "/arbitrage", icon: Zap },
    ],
  },
  {
    key: "community",
    icon: Users,
    items: [
      { key: "copyTrading", href: "/copy", icon: Users },
      { key: "leaderboard", href: "/leaderboard", icon: Trophy },
      { key: "marketplace", href: "/marketplace", icon: Store },
    ],
  },
  {
    key: "system",
    icon: Settings,
    items: [
      { key: "config", href: "/config", icon: Server },
      { key: "infrastructure", href: "/infrastructure", icon: Globe },
      { key: "monitoring", href: "/monitoring", icon: Activity },
      { key: "dashboardBuilder", href: "/dashboard-builder", icon: LayoutGrid },
    ],
  },
];

const secondaryNavigation: NavItem[] = [
  { key: "alerts", href: "/alerts", icon: Bell },
  { key: "settings", href: "/settings", icon: Settings },
];

// Group labels for translations
const groupLabels: Record<string, string> = {
  analysis: "分析",
  portfolio: "投资组合",
  markets: "市场",
  aiTools: "AI 工具",
  exchanges: "交易所",
  community: "社区",
  system: "系统",
};

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  // Find which group contains the current path
  const activeGroup = useMemo(() => {
    for (const group of navGroups) {
      if (group.items.some(item => item.href === pathname)) {
        return group.key;
      }
    }
    return null;
  }, [pathname]);

  // Track expanded groups - auto-expand active group
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    return activeGroup ? new Set([activeGroup]) : new Set();
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const renderNavItem = (item: NavItem, isNested = false) => {
    const isActive = pathname === item.href;
    const name = t(item.key);
    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
      >
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 focus-ring",
            isActive && "bg-sidebar-accent",
            isNested && "pl-9 text-sm"
          )}
          tabIndex={-1}
        >
          <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{name}</span>
        </Button>
      </Link>
    );
  };

  return (
    <aside
      className="hidden md:flex h-dvh w-64 flex-col border-r border-border bg-sidebar"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 shrink-0">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
          aria-hidden="true"
        >
          <CandlestickChart className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Quantum X</span>
      </div>

      <Separator />

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        {/* Core Navigation - Always Visible */}
        <div className="space-y-1 mb-4">
          {coreNavigation.map(item => renderNavItem(item))}
        </div>

        <Separator className="my-3" />

        {/* Grouped Navigation */}
        <div className="space-y-1">
          {navGroups.map(group => {
            const isExpanded = expandedGroups.has(group.key);
            const hasActiveItem = group.items.some(item => item.href === pathname);
            const GroupIcon = group.icon;

            return (
              <div key={group.key}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    hasActiveItem && !isExpanded && "text-primary"
                  )}
                  aria-expanded={isExpanded}
                >
                  <GroupIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1 text-left truncate">
                    {groupLabels[group.key]}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {/* Group Items */}
                {isExpanded && (
                  <div className="mt-1 space-y-1">
                    {group.items.map(item => renderNavItem(item, true))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      <Separator />

      {/* Secondary Navigation */}
      <nav className="space-y-1 px-3 py-3 shrink-0" aria-label="Secondary">
        {secondaryNavigation.map(item => renderNavItem(item))}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4 shrink-0" role="region" aria-label="User info">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"
            aria-hidden="true"
          >
            <span className="text-sm font-medium">QX</span>
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium">Quantum X</p>
            <p className="text-xs text-muted-foreground">Paper Trading</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
