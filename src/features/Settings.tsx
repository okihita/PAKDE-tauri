import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdater } from "@/hooks/useUpdater";
import { useToast } from "@/hooks/useToast";
import { getDb } from "@/db";
import type { CooperativeProfile } from "@/types";

interface Props {
  coopProfile: CooperativeProfile | null;
  setCoopProfile: (v: CooperativeProfile) => void;
}

export default function Settings({ coopProfile, setCoopProfile }: Props) {
  const u = useUpdater();
  const toast = useToast();

  if (!coopProfile) return <div className="text-slate-500 text-xs">Loading profile...</div>;

  const handleFieldChange = (key: string, value: string) => {
    setCoopProfile({ ...coopProfile, [key]: value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const db = await getDb();
      await db.execute(
        `UPDATE cooperatives SET name=?, legal_id=?, address=?, village=?, district=?, regency=?, province=?, postal_code=?, phone=?, email=?, business_units=?, officers=?, updated_at=datetime('now') WHERE id='kdp-001'`,
        [
          coopProfile.name,
          coopProfile.legal_id,
          coopProfile.address,
          coopProfile.village,
          coopProfile.district,
          coopProfile.regency,
          coopProfile.province,
          coopProfile.postal_code,
          coopProfile.phone,
          coopProfile.email,
          coopProfile.business_units,
          coopProfile.officers,
        ],
      );
      toast.success("Profil Koperasi berhasil disimpan!");
    } catch (err) {
      toast.error(`Gagal menyimpan profil: ${err}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#0b101c]/90 border-slate-900 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Profil Organisasi Koperasi Desa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {[
                { key: "name", label: "Nama Koperasi", value: coopProfile.name },
                { key: "legal_id", label: "Nomor Legal Hukum", value: coopProfile.legal_id },
                { key: "address", label: "Alamat", value: coopProfile.address },
                { key: "village", label: "Desa/Kelurahan", value: coopProfile.village },
                { key: "district", label: "Kecamatan", value: coopProfile.district },
                { key: "regency", label: "Kabupaten/Kota", value: coopProfile.regency },
                { key: "province", label: "Provinsi", value: coopProfile.province },
                { key: "postal_code", label: "Kode Pos", value: coopProfile.postal_code },
                { key: "phone", label: "Telepon", value: coopProfile.phone },
                { key: "email", label: "Email", value: coopProfile.email },
              ].map(({ key, label, value }) => (
                <div key={key} className="space-y-1">
                  <label className="text-slate-500 font-mono text-[9px] uppercase">{label}</label>
                  <Input
                    value={value}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    className="bg-slate-950 border-slate-900 text-xs h-8"
                  />
                </div>
              ))}
            </div>
            <Button
              onClick={handleSaveProfile}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9 mt-6"
            >
              Simpan Profil Koperasi
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#0b101c]/90 border-slate-900 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pemeliharaan Aplikasi & Update OTA
            </CardTitle>
            <CardDescription className="text-[10px] text-slate-500">
              Sambungkan ke repositori GitHub untuk mengunduh update biner rilis KDKMP secara langsung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2 text-xs">
            <Button
              onClick={u.checkUpdateCenter}
              disabled={u.isUpdateChecking}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9"
            >
              {u.isUpdateChecking ? "Menghubungi Repositori..." : "Cek Pembaruan Sistem Sekarang"}
            </Button>
            {u.updateStatusText && (
              <span className="text-emerald-400 text-xs font-mono font-semibold block text-center">
                {u.updateStatusText}
              </span>
            )}
            {u.downloadContentLength > 0 && (
              <div className="space-y-2 font-mono text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>
                    Progress: {(u.downloadedBytes / 1024 / 1024).toFixed(2)} MB /{" "}
                    {(u.downloadContentLength / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <span className="font-bold text-emerald-400">{u.downloadProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-900 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${u.downloadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#0b101c]/90 border-slate-900 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Preferensi Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[9px] uppercase">Tema Warna Cockpit</label>
              <Select defaultValue="dark">
                <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs h-8 text-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0b101c] border-slate-900 text-white text-xs">
                  <SelectItem value="dark">🌙 MODE GELAP</SelectItem>
                  <SelectItem value="light">☀️ MODE TERANG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[9px] uppercase">Ukuran Skala Huruf</label>
              <Select defaultValue="normal">
                <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs h-8 text-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0b101c] border-slate-900 text-white text-xs">
                  <SelectItem value="normal">NORMAL</SelectItem>
                  <SelectItem value="large">BESAR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
