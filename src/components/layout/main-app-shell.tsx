"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Briefcase, ClipboardList, FileUser, Search, Users } from "lucide-react";

import { useAuthSession } from "@/hooks/use-auth-session";
import { createClient } from "@/lib/supabase";
import {
  MAIN_VIEW_QUERY,
  MAIN_VIEW_APPLICATIONS,
  MAIN_VIEW_INBOX,
  MAIN_VIEW_MANAGE,
  MAIN_VIEW_RESUME,
  type MainTab,
} from "@/platform/routes";
import type { JobPin } from "@/types/job";
import type { MapPinsMeta } from "@/types/map-job-pins";

import { BottomNav } from "./bottom-nav";

const SeniorResumeWizard = dynamic(
  () =>
    import("@/components/resume/senior-resume-wizard").then((m) => ({
      default: m.SeniorResumeWizard,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-zinc-500">
        불러오는 중…
      </div>
    ),
  }
);

const EmployerToolsPanel = dynamic(
  () =>
    import("@/components/employer/employer-tools-panel").then((m) => ({
      default: m.EmployerToolsPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-zinc-500">
        불러오는 중…
      </div>
    ),
  }
);

const SeniorJobsPanel = dynamic(
  () =>
    import("@/components/senior/senior-jobs-panel").then((m) => ({
      default: m.SeniorJobsPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-zinc-500">
        불러오는 중…
      </div>
    ),
  }
);

const SeniorApplicationStatus = dynamic(
  () =>
    import("@/components/senior/senior-application-status").then((m) => ({
      default: m.SeniorApplicationStatus,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-zinc-500">
        불러오는 중…
      </div>
    ),
  }
);

const EmployerInboxPanel = dynamic(
  () =>
    import("@/components/employer/employer-inbox-panel").then((m) => ({
      default: m.EmployerInboxPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-zinc-500">
        불러오는 중…
      </div>
    ),
  }
);

function tabFromSearchParams(sp: URLSearchParams): MainTab {
  const v = sp.get(MAIN_VIEW_QUERY);
  if (v === MAIN_VIEW_RESUME) return "resume";
  if (v === MAIN_VIEW_APPLICATIONS) return "applications";
  if (v === MAIN_VIEW_MANAGE) return "manage";
  if (v === MAIN_VIEW_INBOX) return "inbox";
  return "jobs";
}

function syncUrl(tab: MainTab) {
  if (tab === "jobs") {
    window.history.replaceState(null, "", "/");
    return;
  }
  const slug =
    tab === "resume"
      ? MAIN_VIEW_RESUME
      : tab === "applications"
        ? MAIN_VIEW_APPLICATIONS
        : tab === "manage"
          ? MAIN_VIEW_MANAGE
          : MAIN_VIEW_INBOX;
  window.history.replaceState(
    null,
    "",
    `/?${MAIN_VIEW_QUERY}=${slug}`
  );
}

/**
 * `useSearchParams` — page 에서 Suspense 로 감쌀 것.
 * 초기 state 에 searchParams 를 넣으면 서버 HTML 과 클라이언트 첫 렌더가
 * 어긋나 hydration 오류(Application error)가 날 수 있어, 탭은 "map" 고정 후
 * 마운트 후 useEffect 에서만 URL 과 맞춘다.
 */
export function MainAppShell({
  kakaoMapAppKey,
  jobPins,
  mapPinsMeta,
}: {
  kakaoMapAppKey: string;
  jobPins: JobPin[];
  mapPinsMeta?: MapPinsMeta;
}) {
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const [profileRole, setProfileRole] = useState<
    "guest" | "senior" | "employer"
  >("guest");

  const [tab, setTabState] = useState<MainTab>("jobs");
  const [resumeMounted, setResumeMounted] = useState(false);
  const [manageMounted, setManageMounted] = useState(false);
  const [inboxMounted, setInboxMounted] = useState(false);
  const [appsMounted, setAppsMounted] = useState(false);
  const [jobsMounted, setJobsMounted] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!session?.user) {
        if (!cancelled) setProfileRole("guest");
        return;
      }
      const supabase = createClient();
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (prof?.role === "senior") setProfileRole("senior");
      else if (prof?.role === "employer") setProfileRole("employer");
      else setProfileRole("guest");
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const next = tabFromSearchParams(searchParams);
    setTabState(next);
    if (next === "resume") setResumeMounted(true);
    if (next === "manage") setManageMounted(true);
    if (next === "inbox") setInboxMounted(true);
    if (next === "applications") setAppsMounted(true);
    if (next === "jobs") setJobsMounted(true);
  }, [searchParams]);

  const setTab = useCallback((next: MainTab) => {
    startTransition(() => {
      setTabState(next);
      if (next === "resume") setResumeMounted(true);
      if (next === "manage") setManageMounted(true);
      if (next === "inbox") setInboxMounted(true);
      if (next === "applications") setAppsMounted(true);
      if (next === "jobs") setJobsMounted(true);
    });
    syncUrl(next);
  }, []);

  const tabItems =
    profileRole === "employer"
      ? ([
          { id: "manage", label: "고용 관리", icon: Briefcase },
          { id: "inbox", label: "\ubc1b\uc740 \uc9c0\uc6d0", icon: Users },
        ] as const)
      : ([
          { id: "jobs", label: "알바 찾기", icon: Search },
          { id: "resume", label: "이력서 관리", icon: FileUser },
          { id: "applications", label: "지원 현황", icon: ClipboardList },
        ] as const);

  useEffect(() => {
    // 역할이 바뀌면(로그인/로그아웃/계정 전환) 현재 탭이 유효한지 보정
    const allowed = new Set(tabItems.map((t) => t.id));
    if (!allowed.has(tab)) {
      const fallback = (tabItems[0]?.id ?? "jobs") as MainTab;
      startTransition(() => {
        setTabState(fallback);
        if (fallback === "jobs") setJobsMounted(true);
        if (fallback === "resume") setResumeMounted(true);
        if (fallback === "applications") setAppsMounted(true);
        if (fallback === "manage") setManageMounted(true);
        if (fallback === "inbox") setInboxMounted(true);
      });
      syncUrl(fallback);
    }
  }, [profileRole, tab, tabItems, startTransition]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        {jobsMounted && (
          <div
            className={
              tab === "jobs"
                ? "absolute inset-0 z-10 flex min-h-0 flex-col bg-zinc-100"
                : "pointer-events-none invisible absolute inset-0 z-10 flex min-h-0 flex-col"
            }
            aria-hidden={tab !== "jobs"}
          >
            <SeniorJobsPanel
              kakaoMapAppKey={kakaoMapAppKey}
              jobPins={jobPins}
              mapPinsMeta={mapPinsMeta}
            />
          </div>
        )}
        {resumeMounted && (
          <div
            className={
              tab === "resume"
                ? "absolute inset-0 z-10 flex min-h-0 flex-col bg-zinc-100"
                : "pointer-events-none invisible absolute inset-0 z-10 flex min-h-0 flex-col"
            }
            aria-hidden={tab !== "resume"}
          >
            <SeniorResumeWizard />
          </div>
        )}
        {appsMounted && (
          <div
            className={
              tab === "applications"
                ? "absolute inset-0 z-10 flex min-h-0 flex-col bg-zinc-100"
                : "pointer-events-none invisible absolute inset-0 z-10 flex min-h-0 flex-col"
            }
            aria-hidden={tab !== "applications"}
          >
            <SeniorApplicationStatus />
          </div>
        )}
        {manageMounted && (
          <div
            className={
              tab === "manage"
                ? "absolute inset-0 z-10 flex min-h-0 flex-col bg-zinc-100"
                : "pointer-events-none invisible absolute inset-0 z-10 flex min-h-0 flex-col"
            }
            aria-hidden={tab !== "manage"}
          >
            <EmployerToolsPanel />
          </div>
        )}
        {inboxMounted && (
          <div
            className={
              tab === "inbox"
                ? "absolute inset-0 z-10 flex min-h-0 flex-col bg-zinc-100"
                : "pointer-events-none invisible absolute inset-0 z-10 flex min-h-0 flex-col"
            }
            aria-hidden={tab !== "inbox"}
          >
            <EmployerInboxPanel />
          </div>
        )}
      </div>
      <BottomNav activeTab={tab} onTabChange={setTab} items={[...tabItems]} />
    </div>
  );
}
