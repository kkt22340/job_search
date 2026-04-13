"use client";

import type { LucideIcon } from "lucide-react";

import { AuthNavStrip } from "@/components/layout/auth-nav-strip";
import type { MainTab } from "@/platform/routes";

export type BottomNavItem = {
  id: MainTab;
  label: string;
  icon: LucideIcon;
};

type Props = {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  items: BottomNavItem[];
};

export function BottomNav({ activeTab, onTabChange, items }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-0 backdrop-blur-md"
      aria-label="주요 메뉴"
    >
      <AuthNavStrip />
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-2">
        {items.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[14px] font-medium leading-tight transition-colors sm:text-[15px] ${
                active
                  ? "text-blue-600"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Icon
                className="h-7 w-7 shrink-0"
                strokeWidth={active ? 2.5 : 2}
                aria-hidden
              />
              <span className="text-center">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
