import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./Sales.css";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Handshake } from "lucide-react";

const VENDORS = [
  { name: "UD Tani Subur", type: "Pemasok Pupuk", contact: "Budi Santoso", phone: "0812-3456-7890", totalTrans: 48 },
  {
    name: "PT Agro Makmur",
    type: "Pembeli Hasil Panen",
    contact: "Siti Rahmawati",
    phone: "0813-5678-9012",
    totalTrans: 36,
  },
  { name: "CV Karya Mandiri", type: "Pemasok Alat", contact: "Agus Wibowo", phone: "0821-7890-1234", totalTrans: 24 },
  { name: "KUD Sumber Rejeki", type: "Mitra Dagang", contact: "Supriyadi", phone: "0857-9012-3456", totalTrans: 62 },
  { name: "Fa. Jaya Abadi", type: "Pemasok Bahan Baku", contact: "Darmanto", phone: "0878-1234-5678", totalTrans: 15 },
  { name: "UD Berkah Tani", type: "Pembeli", contact: "Sri Mulyani", phone: "0856-3456-7890", totalTrans: 29 },
  {
    name: "PT Pangan Lestari",
    type: "Distributor",
    contact: "Hendra Gunawan",
    phone: "0811-5678-9012",
    totalTrans: 53,
  },
  {
    name: "KSU Makmur Bersama",
    type: "Mitra Strategis",
    contact: "Eko Prasetyo",
    phone: "0823-7890-1234",
    totalTrans: 41,
  },
];

export default function Sales() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 overflow-auto p-6">
      <DevDocStripe content={readmeContent} />
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Handshake className="h-3.5 w-3.5 text-amber-400" /> {t("sidebar.nav.sales")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xxs font-mono text-muted-foreground">{t("sales.table.name")}</TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">{t("sales.table.category")}</TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">{t("sales.table.contact")}</TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">{t("sales.table.phone")}</TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("sales.table.transactions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {VENDORS.map((v, i) => (
                <TableRow key={i} className="border-border hover:bg-secondary">
                  <TableCell className="text-xs font-medium text-foreground">{v.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.contact}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{v.phone}</TableCell>
                  <TableCell className="text-xs font-mono text-foreground">{v.totalTrans}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
