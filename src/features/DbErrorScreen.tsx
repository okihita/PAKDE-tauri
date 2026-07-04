import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DbErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#070b14] text-white">
      <div className="w-full max-w-md p-8 bg-slate-950 border border-rose-500/30 rounded-2xl shadow-2xl text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-rose-500 mb-1">Koneksi Database Gagal</h2>
        <p className="text-slate-400 text-xs mb-6">
          Sistem tidak dapat membaca database internal SQLite. Coba jalankan ulang aplikasi.
        </p>
        <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl text-rose-400 text-left font-mono text-[11px] mb-6 overflow-x-auto">
          <code>{message}</code>
        </div>
        <Button variant="destructive" className="w-full" onClick={() => window.location.reload()}>
          Muat Ulang
        </Button>
      </div>
    </div>
  );
}
