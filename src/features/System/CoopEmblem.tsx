import { useState } from "react";
import type { CooperativeProfile } from "@/types";

const SIZES = {
  sm: "w-9 h-9 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-16 h-16 text-lg",
} as const;

export function CoopEmblem({
  profile,
  size = "md",
}: {
  profile: CooperativeProfile | null;
  size?: keyof typeof SIZES;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const initials = (profile?.name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div
      className={`${SIZES[size]} rounded-xl bg-success/15 ring-1 ring-brand/30 flex items-center justify-center shrink-0 overflow-hidden`}
    >
      {profile?.logo_path && !logoFailed ? (
        <img
          src={profile.logo_path}
          alt={profile.name ?? ""}
          className="h-full w-full object-cover"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="font-black text-success">{initials}</span>
      )}
    </div>
  );
}
