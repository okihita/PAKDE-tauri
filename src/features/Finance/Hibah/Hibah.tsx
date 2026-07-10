import { useTranslation } from "react-i18next";

/**
 * Phase 1 placeholder for the "Hibah" (Grants) menu under Keuangan.
 * Tracks grant funding received by the cooperative. Phase 3 will replace
 * this with a cohesive, data-driven grants screen.
 */
export default function Hibah() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-foreground">{t("sidebar.nav.hibah")}</h1>
      <p className="text-sm text-muted-foreground">{t("hibah.placeholder")}</p>
    </div>
  );
}
