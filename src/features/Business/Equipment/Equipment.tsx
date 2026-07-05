import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./Equipment.css";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench } from "lucide-react";

const EQUIPMENT = [
  { name: "Mesin Penggiling Padi", amount: 2, condition: "Baik", lastMaintenance: "2026-06-15", value: 45000000 },
  { name: "Traktor Mini", amount: 1, condition: "Baik", lastMaintenance: "2026-05-20", value: 85000000 },
  { name: "Mesin Pemotong Kayu", amount: 3, condition: "Rusak Ringan", lastMaintenance: "2026-04-10", value: 12000000 },
  { name: "Pompa Air Diesel", amount: 4, condition: "Baik", lastMaintenance: "2026-06-01", value: 8000000 },
  { name: "Kendaraan Angkut", amount: 2, condition: "Perlu Perbaikan", lastMaintenance: "2026-03-22", value: 65000000 },
  { name: "Mesin Jahit Industri", amount: 6, condition: "Baik", lastMaintenance: "2026-06-10", value: 5000000 },
  { name: "Alat Sortir Gabah", amount: 2, condition: "Baik", lastMaintenance: "2026-05-28", value: 22000000 },
  { name: "Genset 5000W", amount: 1, condition: "Rusak Ringan", lastMaintenance: "2026-02-14", value: 15000000 },
];

export default function Equipment() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 overflow-auto p-6">
      <DevDocStripe content={readmeContent} />
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 text-amber-400" /> {t("sidebar.nav.equipment")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xxs font-mono text-muted-foreground">{t("equipment.table.name")}</TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("equipment.table.amount")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("equipment.table.condition")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("equipment.table.lastMaintenance")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">{t("equipment.table.value")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EQUIPMENT.map((e, i) => (
                <TableRow key={i} className="border-border hover:bg-secondary">
                  <TableCell className="text-xs font-medium text-foreground">{e.name}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{e.amount}</TableCell>
                  <TableCell className="text-xs">
                    <span
                      className={`text-xxxs font-bold px-1.5 py-0.5 rounded ${
                        e.condition === "Baik"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : e.condition === "Rusak Ringan"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {e.condition}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{e.lastMaintenance}</TableCell>
                  <TableCell className="text-xs font-mono text-foreground">{e.value.toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
