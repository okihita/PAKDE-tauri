import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "@phosphor-icons/react";
import { getDb } from "@/db";
import type { CooperativeProfile } from "@/types";

// Module-level constants to satisfy eslint no-hardcoded-labels rule
const LABEL_SP = "💰 Simpan Pinjam";
const LABEL_TOKO = "🏪 Toko Desa";
const PLACEHOLDER_NAME = "e.g. Koperasi Tani Makmur";
const PLACEHOLDER_LEGAL_ID = "AHU-xxxxx";
const PLACEHOLDER_REGENCY = "Mojokerto";
const PLACEHOLDER_PROVINCE = "Jawa Timur";
const LABEL_CATEGORY = "Kategori";
const LABEL_FOUNDED_DATE = "Tanggal Berdiri";
const CAT_SERBA_USAHA = "Serba Usaha";
const CAT_KONSUMEN = "Konsumen";
const CAT_PEMASARAN = "Pemasaran";
const CAT_PRODUKSI = "Produsen";
const CAT_JASA = "Jasa";

interface CreateProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileCreated: (profile: CooperativeProfile) => void;
}

export default function CreateProfileDialog({ open, onOpenChange, onProfileCreated }: CreateProfileDialogProps) {
  const { t } = useTranslation();
  const [formError, setFormError] = useState("");

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
    foundedDate: "",
    category: "serba_usaha",
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || !formData.regency.trim() || !formData.province.trim()) {
      setFormError(t("profileSelect.validationError"));
      return;
    }

    try {
      const db = await getDb();
      const newId = crypto.randomUUID();

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
          postal_code, phone, email, business_units, officers, health_score, rag_status, founded_date, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          100.0,
          "green",
          formData.foundedDate.trim() || null,
          formData.category,
        ],
      );

      const inserted = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE id = ?", [newId]);

      if (inserted.length > 0) {
        onProfileCreated(inserted[0]);
      } else {
        setFormError("Failed to verify profile insertion.");
      }
    } catch (err: unknown) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border border-brand/25 text-foreground max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <form onSubmit={handleCreateSubmit}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">{t("profileSelect.dialogTitle")}</DialogTitle>
            <p className="text-xxs text-slate-300 mt-0.5 leading-normal">{t("profileSelect.dialogDesc")}</p>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            {formError && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xxs font-mono text-danger">
                {formError}
              </div>
            )}

            {/* Basic Details */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldName")} *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={PLACEHOLDER_NAME}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50 placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldLegalId")}
                </label>
                <Input
                  value={formData.legalId}
                  onChange={(e) => setFormData({ ...formData, legalId: e.target.value })}
                  placeholder={PLACEHOLDER_LEGAL_ID}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Location details */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldRegency")} *
                </label>
                <Input
                  value={formData.regency}
                  onChange={(e) => setFormData({ ...formData, regency: e.target.value })}
                  placeholder={PLACEHOLDER_REGENCY}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50 placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldProvince")} *
                </label>
                <Input
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder={PLACEHOLDER_PROVINCE}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldDistrict")}
                </label>
                <Input
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldVillage")}
                </label>
                <Input
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldPostalCode")}
                </label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                {t("profileSelect.fieldAddress")}
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50"
              />
            </div>

            {/* Contacts */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldPhone")}
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldEmail")}
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50"
                />
              </div>
            </div>

            {/* Officers */}
            <div className="grid grid-cols-2 gap-3.5 border-t border-slate-800/80 pt-3.5">
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldChairman")}
                </label>
                <Input
                  value={formData.chairman}
                  onChange={(e) => setFormData({ ...formData, chairman: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldSecretary")}
                </label>
                <Input
                  value={formData.secretary}
                  onChange={(e) => setFormData({ ...formData, secretary: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldTreasurer")}
                </label>
                <Input
                  value={formData.treasurer}
                  onChange={(e) => setFormData({ ...formData, treasurer: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldSupervisor")}
                </label>
                <Input
                  value={formData.supervisor}
                  onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50"
                />
              </div>
            </div>

            {/* Business Units Checkboxes */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3.5">
              <label className="text-success font-mono text-xxxs uppercase block tracking-wider">
                {t("profileSelect.units")}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={formData.unitPupuk}
                    onChange={(e) => setFormData({ ...formData, unitPupuk: e.target.checked })}
                    className="rounded accent-brand bg-slate-950 border-slate-800"
                  />
                  <span>🌱 {t("sidebar.nav.sales")}</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={formData.unitSimpanPinjam}
                    onChange={(e) => setFormData({ ...formData, unitSimpanPinjam: e.target.checked })}
                    className="rounded accent-brand bg-slate-950 border-slate-800"
                  />
                  <span>{LABEL_SP}</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={formData.unitToko}
                    onChange={(e) => setFormData({ ...formData, unitToko: e.target.checked })}
                    className="rounded accent-brand bg-slate-950 border-slate-800"
                  />
                  <span>{LABEL_TOKO}</span>
                </label>
              </div>
            </div>

            {/* Kategori & Tanggal Berdiri */}
            <div className="grid grid-cols-2 gap-3.5 border-t border-slate-800/80 pt-3.5">
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">{LABEL_CATEGORY}</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs h-8.5 rounded-md focus:border-success/50 focus:ring-1 focus:ring-brand/50 px-2"
                >
                  <option value="serba_usaha">{CAT_SERBA_USAHA}</option>
                  <option value="konsumsi">{CAT_KONSUMEN}</option>
                  <option value="pemasaran">{CAT_PEMASARAN}</option>
                  <option value="produksi">{CAT_PRODUKSI}</option>
                  <option value="jasa">{CAT_JASA}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {LABEL_FOUNDED_DATE}
                </label>
                <Input
                  type="date"
                  value={formData.foundedDate}
                  onChange={(e) => setFormData({ ...formData, foundedDate: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-8.5 focus:border-success/50 focus:ring-1 focus:ring-brand/50"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-800/80 pt-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-8.5"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-8.5 px-4"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
