"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, BarChart2, DollarSign, ClipboardList, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/contexts/language-context";

function buildNavItems(lang: Lang) {
  const t = getT(lang);
  return [
    {
      label: "Literature",
      href: "/dashboard/literature",
      icon: BookOpen,
      description: t.nav_literature_desc,
      disabled: false,
    },
    {
      label: "Manuscript",
      href: "/dashboard/manuscript",
      icon: FileText,
      description: t.nav_manuscript_desc,
      disabled: false,
    },
    {
      label: "Data Analysis",
      href: "/dashboard/analysis",
      icon: BarChart2,
      description: t.nav_analysis_desc,
      disabled: false,
    },
    {
      label: "Grant Builder",
      href: "/dashboard/grants",
      icon: DollarSign,
      description: t.nav_grants_desc,
      disabled: true,
    },
    {
      label: "Compliance",
      href: "/dashboard/compliance",
      icon: ClipboardList,
      description: t.nav_compliance_desc,
      disabled: true,
    },
  ];
}

export function Sidebar() {
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const navItems = buildNavItems(lang);
  const t = getT(lang);

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-blue-400" />
          <span className="text-lg font-semibold">ResearchPilot</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Medical Research Copilot</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <div key={item.href}>
              {item.disabled ? (
                <div className="flex items-center gap-3 px-3 py-2 rounded-md opacity-40 cursor-not-allowed">
                  <Icon className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-300">{item.label}</div>
                    <div className="text-xs text-slate-500">{t.nav_coming_soon}</div>
                  </div>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className={cn("text-xs", isActive ? "text-blue-200" : "text-slate-500")}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer with language toggle */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        {/* Language toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{t.lang_label}</span>
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {(["it", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-3 py-1 text-xs font-medium transition-colors",
                  lang === l
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                {l === "it" ? "🇮🇹 IT" : "🇬🇧 EN"}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-600">v0.1.0 — Beta</div>
      </div>
    </aside>
  );
}
