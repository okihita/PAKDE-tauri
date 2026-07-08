import { useState, useEffect, useRef } from "react";
import { searchProvinces, searchRegencies, searchDistricts, searchVillages, type WilayahRow } from "./wilayahDb";

interface RegionValue {
  province_code: string;
  province_name: string;
  regency_code: string;
  regency_name: string;
  district_code: string;
  district_name: string;
  village_code: string;
  village_name: string;
}

interface Props {
  onChange: (value: RegionValue) => void;
}

const L_PROVINSI = "Provinsi";
const L_KABKOTA = "Kabupaten / Kota";
const L_KECAMATAN = "Kecamatan";
const L_DESA = "Desa / Kelurahan";
const L_SEARCH = "Ketik untuk mencari...";
const L_SELECT_PROV = "Pilih provinsi terlebih dahulu";
const L_SELECT_KAB = "Pilih kabupaten/kota terlebih dahulu";

export default function RegionPicker({ onChange }: Props) {
  const [province, setProvince] = useState<WilayahRow | null>(null);
  const [regency, setRegency] = useState<WilayahRow | null>(null);
  const [district, setDistrict] = useState<WilayahRow | null>(null);
  const [village, setVillage] = useState<WilayahRow | null>(null);

  const emit = (
    p: WilayahRow | null,
    r: WilayahRow | null,
    d: WilayahRow | null,
    v: WilayahRow | null,
  ) => {
    onChange({
      province_code: p?.kode ?? "",
      province_name: p?.nama ?? "",
      regency_code: r?.kode ?? "",
      regency_name: r?.nama ?? "",
      district_code: d?.kode ?? "",
      district_name: d?.nama ?? "",
      village_code: v?.kode ?? "",
      village_name: v?.nama ?? "",
    });
  };

  return (
    <div className="space-y-3">
      <ComboboxField
        label={L_PROVINSI}
        onSearch={(q) => searchProvinces(q)}
        selected={province}
        onSelect={(p) => {
          setProvince(p);
          setRegency(null);
          setDistrict(null);
          setVillage(null);
          emit(p, null, null, null);
        }}
        placeholder={L_SEARCH}
      />
      <ComboboxField
        label={L_KABKOTA}
        onSearch={(q) => (province ? searchRegencies(province.kode, q) : Promise.resolve([]))}
        selected={regency}
        onSelect={(r) => {
          setRegency(r);
          setDistrict(null);
          setVillage(null);
          emit(province, r, null, null);
        }}
        disabled={!province}
        placeholder={province ? L_SEARCH : L_SELECT_PROV}
      />
      <ComboboxField
        label={L_KECAMATAN}
        onSearch={(q) => (regency ? searchDistricts(regency.kode, q) : Promise.resolve([]))}
        selected={district}
        onSelect={(d) => {
          setDistrict(d);
          setVillage(null);
          emit(province, regency, d, null);
        }}
        disabled={!regency}
        placeholder={regency ? L_SEARCH : L_SELECT_KAB}
      />
      <ComboboxField
        label={L_DESA}
        onSearch={(q) => searchVillages(district?.kode ?? null, q)}
        selected={village}
        onSelect={(v) => {
          setVillage(v);
          emit(province, regency, district, v);
        }}
        disabled={!regency}
        placeholder={regency ? L_SEARCH : L_SELECT_KAB}
        renderOption={(row) => {
          const v = row as WilayahRow & { district_nama?: string; regency_nama?: string };
          if (v.district_nama) {
            return `${v.nama}, Kec. ${v.district_nama}, Kab. ${v.regency_nama}`;
          }
          return v.nama;
        }}
      />
    </div>
  );
}

/** Simple combobox: text input + dropdown list. */
function ComboboxField({
  label,
  onSearch,
  selected,
  onSelect,
  disabled,
  placeholder,
  renderOption,
}: {
  label: string;
  onSearch: (query: string) => Promise<WilayahRow[]>;
  selected: WilayahRow | null;
  onSelect: (row: WilayahRow) => void;
  disabled?: boolean;
  placeholder?: string;
  renderOption?: (row: WilayahRow & { district_nama?: string; regency_nama?: string }) => string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.nama ?? "");
  const [results, setResults] = useState<WilayahRow[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync query when selected changes externally
  useEffect(() => {
    setQuery(selected?.nama ?? "");
  }, [selected]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = async (value: string) => {
    setQuery(value);
    setOpen(true);
    if (value.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await onSearch(value);
      setResults(rows);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-1" ref={ref}>
      <label className="text-success font-mono text-xxxs uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (query.length >= 1) setOpen(true); }}
          className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs h-8.5 rounded-md px-2 focus:border-success/50 focus:ring-1 focus:ring-brand/50 placeholder:text-slate-500 disabled:opacity-40"
        />
        {open && results.length > 0 && (
          <ul className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-md shadow-lg">
            {results.map((row) => (
              <li
                key={row.kode}
                className="px-2.5 py-1.5 text-xxs text-slate-300 hover:bg-slate-800 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(row);
                  setQuery(renderOption ? renderOption(row as any) : row.nama);
                  setOpen(false);
                }}
              >
                {renderOption ? renderOption(row as any) : row.nama}
              </li>
            ))}
          </ul>
        )}
        {loading && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xxxs text-slate-600">...</span>
        )}
      </div>
    </div>
  );
}
