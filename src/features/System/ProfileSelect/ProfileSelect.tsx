import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Plus, Shield, Sparkles, MapPin } from "lucide-react";
import { getDb } from "@/db";
import type { CooperativeProfile } from "@/types";

const PLACEHOLDER_NAME = "e.g. Koperasi Tani Makmur";
const PLACEHOLDER_LEGAL_ID = "AHU-xxxxx";
const PLACEHOLDER_REGENCY = "Mojokerto";
const PLACEHOLDER_PROVINCE = "Jawa Timur";
const LABEL_SP = "💰 Simpan Pinjam";
const LABEL_TOKO = "🏪 Toko Desa";

interface ProfileSelectProps {
  onProfileSelect: (profile: CooperativeProfile) => void;
}

export default function ProfileSelect({ onProfileSelect }: ProfileSelectProps) {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<CooperativeProfile[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    legalId: "",
    address: "",
    village: "",
    district: "",
    regency: "",
    province: "",
    postalCode: "",
    phone: "",
    email: "",
    chairman: "",
    secretary: "",
    treasurer: "",
    supervisor: "",
    unitPupuk: true,
    unitSimpanPinjam: true,
    unitToko: false,
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        const list = await db.select<CooperativeProfile[]>(
          "SELECT * FROM cooperatives ORDER BY created_at DESC"
        );
        setProfiles(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || !formData.regency.trim() || !formData.province.trim()) {
      setFormError(t("profileSelect.validationError"));
      return;
    }

    try {
      const db = await getDb();
      const newId = `kdp-${Date.now().toString().slice(-6)}`;

      const units: string[] = [];
      if (formData.unitPupuk) units.push("unit_pupuk");
      if (formData.unitSimpanPinjam) units.push("unit_simpan_pinjam");
      if (formData.unitToko) units.push("unit_toko_desa");

      const officersJson = JSON.stringify({
        chairman: formData.chairman.trim(),
        secretary: formData.secretary.trim(),
        treasurer: formData.treasurer.trim(),
        supervisor: formData.supervisor.trim(),
      });

      await db.execute(
        `INSERT INTO cooperatives (
          id, name, legal_id, address, village, district, regency, province,
          postal_code, phone, email, business_units, officers, health_score, rag_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          formData.name.trim(),
          formData.legalId.trim() || null,
          formData.address.trim() || null,
          formData.village.trim() || null,
          formData.district.trim() || null,
          formData.regency.trim(),
          formData.province.trim(),
          formData.postalCode.trim() || null,
          formData.phone.trim() || null,
          formData.email.trim() || null,
          JSON.stringify(units),
          officersJson,
          100.0, // default new health score
          "green",
        ]
      );

      // Query and fetch the inserted row to get default field states
      const inserted = await db.select<CooperativeProfile[]>(
        "SELECT * FROM cooperatives WHERE id = ?",
        [newId]
      );

      if (inserted.length > 0) {
        onProfileSelect(inserted[0]);
      } else {
        setFormError("Failed to verify profile insertion.");
      }
    } catch (err: unknown) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const getBusinessUnitCount = (unitsStr: string | null) => {
    if (!unitsStr) return 0;
    try {
      const parsed = JSON.parse(unitsStr);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div
      className="flex-1 flex flex-col justify-center items-center h-full w-full relative overflow-hidden p-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* Cinematic dark overlay with blur and vignette */}
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px] bg-gradient-to-b from-slate-950/10 via-slate-950/45 to-slate-950/75" />

      <div className="relative z-10 w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header section */}
        <div className="text-center space-y-2 p-6 rounded-2xl bg-slate-950/75 border border-emerald-500/25 backdrop-blur-md max-w-lg mx-auto shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="flex justify-center mb-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Shield className="h-6 w-6 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-wider font-mono">
            {t("profileSelect.title")}
          </h1>
          <p className="text-xxs font-mono text-slate-200 max-w-md mx-auto leading-relaxed">
            {t("profileSelect.subtitle")}
          </p>
        </div>

        {/* Profile list loading */}
        {loading ? (
          <div className="text-center py-12 text-xxs font-mono text-slate-300">
            {t("common.loading")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {profiles.map((p) => {
              const uCount = getBusinessUnitCount(p.business_units);
              return (
                <Card
                  key={p.id}
                  onClick={() => onProfileSelect(p)}
                  className="bg-slate-950/90 border-emerald-500/25 backdrop-blur-md cursor-pointer hover-glow-card transition-all duration-200 flex flex-col justify-between min-h-48 p-5 hover:scale-[1.01] select-none shadow-[0_4px_25px_rgba(0,0,0,0.4)]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-8.5 h-8.5 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                        <Building2 className="h-4 w-4 text-emerald-400" />
                      </div>
                      <span className="text-xxxs font-mono font-bold text-emerald-400 uppercase border border-emerald-500/30 px-1.5 py-0.5 rounded bg-emerald-950/20">
                        {p.id}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-foreground line-clamp-1 leading-tight">
                        {p.name}
                      </h3>
                      <p className="text-xxs text-slate-300 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-300">{p.regency}, {p.province}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border/40 font-mono text-xxs">
                    <div className="flex justify-between items-center text-xxxs">
                      <span className="text-slate-400 uppercase">{t("profileSelect.health")}</span>
                      <span className="text-emerald-400 font-bold">{p.health_score}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${p.health_score}%` }}
                      />
                    </div>
                    <p className="text-xxxs text-slate-400 mt-1">
                      {t("profileSelect.units")}: <span className="text-emerald-400 font-bold">{uCount}</span>
                    </p>
                  </div>
                </Card>
              );
            })}

            {/* "+ Create New" item card */}
            <Card
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-950/70 border-dashed border-emerald-500/25 backdrop-blur-sm hover:border-emerald-400/40 hover:bg-emerald-500/5 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-48 p-5 hover:scale-[1.01] select-none shadow-[0_4px_25px_rgba(0,0,0,0.3)]"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/5 flex items-center justify-center mb-3 group-hover:bg-emerald-500/10 transition-colors">
                <Plus className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-xxs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                {t("profileSelect.createBtn")}
              </span>
            </Card>
          </div>
        )}
      </div>

      {/* Creation Dialogue */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-slate-900 border border-emerald-500/25 text-foreground max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground">
                {t("profileSelect.dialogTitle")}
              </DialogTitle>
              <p className="text-xxs text-slate-300 mt-0.5 leading-normal">
                {t("profileSelect.dialogDesc")}
              </p>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xxs font-mono text-rose-400">
                  {formError}
                </div>
              )}

              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldName")} *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={PLACEHOLDER_NAME}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldLegalId")}
                  </label>
                  <Input
                    value={formData.legalId}
                    onChange={(e) => setFormData({ ...formData, legalId: e.target.value })}
                    placeholder={PLACEHOLDER_LEGAL_ID}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Location details */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldRegency")} *
                  </label>
                  <Input
                    value={formData.regency}
                    onChange={(e) => setFormData({ ...formData, regency: e.target.value })}
                    placeholder={PLACEHOLDER_REGENCY}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldProvince")} *
                  </label>
                  <Input
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder={PLACEHOLDER_PROVINCE}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldDistrict")}
                  </label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldVillage")}
                  </label>
                  <Input
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldPostalCode")}
                  </label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldAddress")}
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldPhone")}
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldEmail")}
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Officers */}
              <div className="grid grid-cols-2 gap-3.5 border-t border-slate-800/80 pt-3.5">
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldChairman")}
                  </label>
                  <Input
                    value={formData.chairman}
                    onChange={(e) => setFormData({ ...formData, chairman: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldSecretary")}
                  </label>
                  <Input
                    value={formData.secretary}
                    onChange={(e) => setFormData({ ...formData, secretary: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldTreasurer")}
                  </label>
                  <Input
                    value={formData.treasurer}
                    onChange={(e) => setFormData({ ...formData, treasurer: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-emerald-400 font-mono text-xxxs uppercase tracking-wider">
                    {t("profileSelect.fieldSupervisor")}
                  </label>
                  <Input
                    value={formData.supervisor}
                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Business Units Checkboxes */}
              <div className="space-y-2 border-t border-slate-800/80 pt-3.5">
                <label className="text-emerald-400 font-mono text-xxxs uppercase block tracking-wider">
                  {t("profileSelect.units")}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900 select-none">
                    <input
                      type="checkbox"
                      checked={formData.unitPupuk}
                      onChange={(e) => setFormData({ ...formData, unitPupuk: e.target.checked })}
                      className="rounded accent-emerald-500 bg-slate-950 border-slate-800"
                    />
                    <span>🌱 {t("sidebar.nav.sales")}</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900 select-none">
                    <input
                      type="checkbox"
                      checked={formData.unitSimpanPinjam}
                      onChange={(e) => setFormData({ ...formData, unitSimpanPinjam: e.target.checked })}
                      className="rounded accent-emerald-500 bg-slate-950 border-slate-800"
                    />
                    <span>{LABEL_SP}</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900 select-none">
                    <input
                      type="checkbox"
                      checked={formData.unitToko}
                      onChange={(e) => setFormData({ ...formData, unitToko: e.target.checked })}
                      className="rounded accent-emerald-500 bg-slate-950 border-slate-800"
                    />
                    <span>{LABEL_TOKO}</span>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-800/80 pt-3.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-8.5"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8.5 px-4"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
