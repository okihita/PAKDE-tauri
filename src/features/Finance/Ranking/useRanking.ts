import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CooperativeProfile } from "@/types";
import {
  MockRankingService,
  OfflineError,
  type Leaderboard,
  type RankingMetric,
  type RankingScope,
  type RankingService,
} from "./rankingService";

const SCOPES: RankingScope[] = ["kabupaten", "provinsi", "nasional"];
const METRICS: RankingMetric[] = ["health", "growth", "membership", "impact"];
const STALE_MS = 30 * 60 * 1000;
const REFRESH_POLL_MS = 60 * 1000;

const service: RankingService = new MockRankingService();

export type RankingStatus = "loading" | "live" | "stale" | "offline";

export interface RankingState {
  status: RankingStatus;
  online: boolean;
  lastUpdated: number | null;
  boards: Partial<Record<RankingScope, Partial<Record<RankingMetric, Leaderboard>>>>;
  ourRanks: Record<RankingScope, number | null>;
  isSubmitting: boolean;
  refresh: () => void;
  submitStats: () => Promise<void>;
}

/**
 * Single source of truth for ranking data, shared by the Sidebar beacon and the
 * Ranking screen. Connectivity is REAL (navigator.onLine + online/offline events);
 * data is mocked by MockRankingService. The screen/beacon never fetch on their own.
 */
export function useRanking(coopProfile: CooperativeProfile | null): RankingState {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [status, setStatus] = useState<RankingStatus>("loading");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [boards, setBoards] = useState<RankingState["boards"]>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reqId = useRef(0);
  const lastUpdatedRef = useRef<number | null>(null);
  useEffect(() => {
    lastUpdatedRef.current = lastUpdated;
  }, [lastUpdated]);

  const refresh = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOnline(false);
      setStatus((s) => (lastUpdatedRef.current ? (s === "loading" ? "offline" : s) : "offline"));
      return;
    }
    setOnline(true);
    const id = ++reqId.current;
    setStatus((s) => (lastUpdatedRef.current ? s : "loading"));
    try {
      const results = await Promise.all(
        SCOPES.flatMap((scope) => METRICS.map((metric) => service.fetchLeaderboard(scope, metric, coopProfile))),
      );
      if (id !== reqId.current) return;
      const next: RankingState["boards"] = {};
      for (const lb of results) {
        const scopeBoards = (next[lb.scope] ??= {});
        scopeBoards[lb.metric] = lb;
      }
      setBoards(next);
      const now = Date.now();
      setLastUpdated(now);
      setStatus("live");
    } catch (e) {
      if (e instanceof OfflineError) {
        setOnline(false);
        setStatus((s) => (lastUpdatedRef.current ? (s === "loading" ? "offline" : s) : "offline"));
      } else {
        console.error("[ranking] fetch failed", e);
      }
    }
  }, [coopProfile]);

  // React to real connectivity changes.
  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      void refresh();
    };
    const onOffline = () => setStatus((s) => (lastUpdatedRef.current ? (s === "loading" ? "offline" : s) : "offline"));
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh]);

  // Initial load + auto-refresh when cache is stale (intermittent connection friendly).
  useEffect(() => {
    if (!online) return;
    const stale = lastUpdatedRef.current !== null && Date.now() - lastUpdatedRef.current > STALE_MS;
    if (!lastUpdatedRef.current) {
      void refresh();
    } else if (stale) {
      setStatus("stale");
      void refresh();
    }
    const iv = setInterval(() => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (lastUpdatedRef.current !== null && Date.now() - lastUpdatedRef.current > STALE_MS) {
        setStatus("stale");
        void refresh();
      }
    }, REFRESH_POLL_MS);
    return () => clearInterval(iv);
  }, [online, refresh]);

  const submitStats = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setIsSubmitting(true);
    try {
      await service.submitStats(coopProfile);
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  }, [coopProfile, refresh]);

  const ourRanks = useMemo(() => {
    const out = {} as Record<RankingScope, number | null>;
    for (const scope of SCOPES) {
      out[scope] = boards[scope]?.["health"]?.ourRank ?? null;
    }
    return out;
  }, [boards]);

  return { status, online, lastUpdated, boards, ourRanks, isSubmitting, refresh, submitStats };
}
