import Participation from "@/features/Community/Participation/Participation";
import Impact from "@/features/Community/Impact/Impact";

/**
 * Phase 1 placeholder for the consolidated "Dampak Sosial" menu.
 * Stacks the existing Participation and Impact screens so no behavior is lost;
 * Phase 3 will replace this with a single cohesive, data-driven screen.
 */
export default function Dampak() {
  return (
    <div className="space-y-6">
      <Participation />
      <Impact />
    </div>
  );
}
