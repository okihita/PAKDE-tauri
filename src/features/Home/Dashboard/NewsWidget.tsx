import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  NewspaperIcon,
  Buildings,
  MapPin,
  Flag,
  Megaphone,
  CaretRight,
  PushPin,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { type NewsItem } from "@/data/news";
import { getNewsItems } from "@/db/news";
import NewsDetailModal from "./NewsDetailModal";

const NEWS_READ_KEY = "pakde-news-read";

type FilterTab = "all" | "internal" | "government";

const SOURCE_BADGE: Record<NewsItem["source"], string> = {
  kementerian: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  provinsi: "bg-info/10 text-info border border-info/20",
  kabupaten: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  internal: "bg-brand/10 text-brand border border-brand/20",
};

const SOURCE_ICON: Record<NewsItem["source"], typeof Buildings> = {
  kementerian: Buildings,
  provinsi: MapPin,
  kabupaten: Flag,
  internal: Megaphone,
};

function formatRelativeTimestamp(iso: string, locale: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isIndo = locale.startsWith("id");

  if (diffDays === 0) {
    const timeStr = date.toLocaleTimeString(isIndo ? "id-ID" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${isIndo ? "Hari ini" : "Today"}, ${timeStr}`;
  }

  if (diffDays === 1) {
    const timeStr = date.toLocaleTimeString(isIndo ? "id-ID" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${isIndo ? "Kemarin" : "Yesterday"}, ${timeStr}`;
  }

  if (diffDays > 1 && diffDays < 7) {
    return isIndo ? `${diffDays} hari lalu` : `${diffDays}d ago`;
  }

  return date.toLocaleDateString(isIndo ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function useNewsRead(items: NewsItem[], coopId: string) {
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`${NEWS_READ_KEY}:${coopId}`);
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(`${NEWS_READ_KEY}:${coopId}`, JSON.stringify([...readIds]));
  }, [readIds, coopId]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  }, []);

  const toggleRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    const allIds = items.map((n) => n.id);
    setReadIds(new Set(allIds));
  }, [items]);

  return { readIds, markRead, toggleRead, markAllRead };
}

interface NewsWidgetProps {
  coopId: string;
}

export default function NewsWidget({ coopId }: NewsWidgetProps) {
  const { t, i18n } = useTranslation();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    getNewsItems(coopId)
      .then((items) => {
        if (alive) {
          setNewsItems(items);
          setNewsLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setNewsItems([]);
          setNewsLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [coopId]);

  const { readIds, markRead, toggleRead, markAllRead } = useNewsRead(newsItems, coopId);

  const unreadCount = useMemo(() => newsItems.filter((n) => !readIds.has(n.id)).length, [newsItems, readIds]);

  const unreadByTab = useMemo(() => {
    const isGov = (src: NewsItem["source"]) => src === "kabupaten" || src === "provinsi" || src === "kementerian";
    return {
      all: newsItems.filter((n) => !readIds.has(n.id)).length,
      internal: newsItems.filter((n) => n.source === "internal" && !readIds.has(n.id)).length,
      government: newsItems.filter((n) => isGov(n.source) && !readIds.has(n.id)).length,
    };
  }, [newsItems, readIds]);

  const filteredNews = useMemo(() => {
    return newsItems.filter((item) => {
      if (activeTab === "internal" && item.source !== "internal") return false;
      if (activeTab === "government" && item.source === "internal") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchContent = item.content.toLowerCase().includes(q);
        const matchSource = item.sourceName.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchSource) return false;
      }
      return true;
    });
  }, [newsItems, activeTab, searchQuery]);

  const selectedNews = selectedIndex !== null && filteredNews[selectedIndex] ? filteredNews[selectedIndex] : null;

  const handleNextNews = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < filteredNews.length - 1) {
      const nextIdx = selectedIndex + 1;
      setSelectedIndex(nextIdx);
      const nextItem = filteredNews[nextIdx];
      if (nextItem && !readIds.has(nextItem.id)) {
        markRead(nextItem.id);
      }
    }
  }, [selectedIndex, filteredNews, readIds, markRead]);

  const handlePrevNews = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      const prevIdx = selectedIndex - 1;
      setSelectedIndex(prevIdx);
      const prevItem = filteredNews[prevIdx];
      if (prevItem && !readIds.has(prevItem.id)) {
        markRead(prevItem.id);
      }
    }
  }, [selectedIndex, filteredNews, readIds, markRead]);

  return (
    <Card className="bg-card border-border text-foreground hover-glow-card flex flex-col h-full">
      <CardHeader className="p-0 space-y-0 relative border-b border-border/40">
        {/* Standalone illustrated title bar strip */}
        <div className="relative overflow-hidden rounded-t-xl px-3 h-11 flex items-center justify-between shrink-0">
          <div
            className="absolute inset-0 bg-cover bg-left bg-no-repeat pointer-events-none opacity-30 dark:opacity-40 transition-opacity"
            style={{ backgroundImage: 'url("/banners/news-banner.webp")' }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-card/85 via-card/50 to-transparent pointer-events-none z-1" />

          <div className="relative z-10 flex items-center justify-between w-full gap-2">
            <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2 min-w-0">
              <NewspaperIcon className="h-3.5 w-3.5 text-info shrink-0" weight="duotone" />
              <span className="truncate">{t("beranda.news.title")}</span>
              {unreadCount > 0 && (
                <span className="shrink-0 text-xxxs font-bold px-1.5 py-0.5 rounded-full bg-info/15 text-info animate-pulse">
                  {t("beranda.news.unread", { n: unreadCount })}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setShowSearch((prev) => !prev);
                  if (showSearch) setSearchQuery("");
                }}
                className={`p-1 rounded transition-colors ${
                  showSearch || searchQuery
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={t("beranda.news.searchPlaceholder")}
              >
                <MagnifyingGlass className="h-3.5 w-3.5" />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xxxs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {t("beranda.news.markRead")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Controls sub-row below title illustration */}
        <div className="p-2.5 bg-card/50 border-t border-border/20">
          {showSearch ? (
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("beranda.news.searchPlaceholder")}
                className="h-6 text-xs bg-input border-border text-foreground pr-7 placeholder:text-muted-foreground"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-md text-xxxs">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-1 px-1.5 rounded font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === "all"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{t("beranda.news.filterAll")}</span>
                {unreadByTab.all > 0 && <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />}
              </button>
              <button
                onClick={() => setActiveTab("internal")}
                className={`flex-1 py-1 px-1.5 rounded font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === "internal"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{t("beranda.news.filterInternal")}</span>
                {unreadByTab.internal > 0 && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
              </button>
              <button
                onClick={() => setActiveTab("government")}
                className={`flex-1 py-1 px-1.5 rounded font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === "government"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{t("beranda.news.filterGovernment")}</span>
                {unreadByTab.government > 0 && <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />}
              </button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto min-h-0 pt-1 pb-3 px-3">
        <div className="space-y-1.5">
          {newsLoading ? (
            <p className="text-xxs text-muted-foreground text-center py-6">{t("beranda.news.loading")}</p>
          ) : filteredNews.length === 0 ? (
            <p className="text-xxs text-muted-foreground text-center py-6">
              {searchQuery ? t("beranda.news.noResults") : t("beranda.news.noNews")}
            </p>
          ) : null}

          {filteredNews.map((item, index) => {
            const isUnread = !readIds.has(item.id);
            const SourceIcon = SOURCE_ICON[item.source];

            return (
              <div
                key={item.id}
                className={`group flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                  isUnread
                    ? "bg-info/5 border-info/30 hover:bg-info/10 shadow-xs"
                    : "bg-card/50 border-border/60 hover:bg-secondary/70"
                }`}
                onClick={() => {
                  setSelectedIndex(index);
                  if (isUnread) markRead(item.id);
                }}
              >
                {/* Left Source Icon Rail with status indicator */}
                <div className="relative mt-0.5 shrink-0">
                  <div
                    className={`p-1.5 rounded-md ${
                      isUnread ? "bg-info/10 text-info" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <SourceIcon className="h-3.5 w-3.5" weight={isUnread ? "fill" : "regular"} />
                  </div>
                  {isUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-info border-2 border-card" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1.5">
                    <h4
                      className={`text-xs leading-snug font-semibold line-clamp-2 ${
                        isUnread ? "text-foreground font-bold" : "text-foreground/90"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <CaretRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-foreground transition-colors shrink-0 mt-0.5" />
                  </div>

                  <p className="text-xxs text-muted-foreground leading-relaxed mt-1 line-clamp-2">{item.content}</p>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-border/40 text-xxxs text-muted-foreground">
                    <span className={`px-1.5 py-0.5 rounded text-xxxs font-medium ${SOURCE_BADGE[item.source]}`}>
                      {item.sourceName}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.pinned && (
                        <span className="flex items-center gap-0.5 text-brand font-medium">
                          <PushPin className="h-3 w-3 fill-brand" weight="fill" />
                          {t("beranda.news.pinned")}
                        </span>
                      )}
                      <span>{formatRelativeTimestamp(item.timestamp, i18n.language)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <NewsDetailModal
        selectedNews={selectedNews}
        onClose={() => setSelectedIndex(null)}
        onNext={handleNextNews}
        onPrev={handlePrevNews}
        isFirst={selectedIndex === 0}
        isLast={selectedIndex === filteredNews.length - 1}
        currentIndex={selectedIndex ?? 0}
        totalCount={filteredNews.length}
        isRead={selectedNews ? readIds.has(selectedNews.id) : false}
        onToggleRead={toggleRead}
        formatRelativeTimestamp={formatRelativeTimestamp}
        sourceBadgeClass={selectedNews ? SOURCE_BADGE[selectedNews.source] : ""}
      />
    </Card>
  );
}
