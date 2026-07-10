import { useState, useEffect, useRef } from "react";
import { CaretDown } from "@phosphor-icons/react";
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
  /**
   * Pre-selected rows (each needs `kode` + `nama`) to seed the pickers, e.g. when
   * editing an existing member. Full `WilayahRow`s are required so both the
   * displayed query and cascading searches initialize correctly.
   */
  initial?: {
    province?: WilayahRow | null;
    regency?: WilayahRow | null;
    district?: WilayahRow | null;
    village?: WilayahRow | null;
  };
}

const L_PROVINSI = "Provinsi";
const L_KABKOTA = "Kabupaten / Kota";
const L_KECAMATAN = "Kecamatan";
const L_DESA = "Desa / Kelurahan";
const L_SEARCH = "Ketik untuk mencari...";
const L_SELECT_PROV = "Pilih provinsi terlebih dahulu";
const L_SELECT_KAB = "Pilih kabupaten/kota terlebih dahulu";

export default function RegionPicker({ onChange, initial }: Props) {
  const [province, setProvince] = useState<WilayahRow | null>(initial?.province ?? null);
  const [regency, setRegency] = useState<WilayahRow | null>(initial?.regency ?? null);
  const [district, setDistrict] = useState<WilayahRow | null>(initial?.district ?? null);
  const [village, setVillage] = useState<WilayahRow | null>(initial?.village ?? null);

  const emit = (p: WilayahRow | null, r: WilayahRow | null, d: WilayahRow | null, v: WilayahRow | null) => {
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
        key={`prov-${province?.kode ?? "none"}`}
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
        key={`reg-${regency?.kode ?? "none"}`}
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
        key={`dist-${district?.kode ?? "none"}`}
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
        key={`vil-${village?.kode ?? "none"}`}
        label={L_DESA}
        onSearch={(q) => searchVillages(district?.kode ?? null, q)}
        selected={village}
        onSelect={(v) => {
          setVillage(v);
          emit(province, regency, district, v);
        }}
        disabled={!district}
        placeholder={district ? L_SEARCH : "Pilih kecamatan terlebih dahulu"}
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

/** Combobox with keyboard nav, debounced search, ARIA, scroll-into-view. */
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
  const [highlightIdx, setHighlightIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = async (value: string) => {
    if (value.length < 1) {
      setResults([]);
      setHighlightIdx(0);
      return;
    }
    setLoading(true);
    try {
      const rows = await onSearch(value);
      setResults(rows);
      setHighlightIdx(0);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleInput = (value: string) => {
    setQuery(value);
    setOpen(true);
    // Instant search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 0);
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlightIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIdx, open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(results[highlightIdx]);
      setQuery(
        renderOption
          ? renderOption(results[highlightIdx] as WilayahRow & { district_nama?: string; regency_nama?: string })
          : results[highlightIdx].nama,
      );
      setOpen(false);
    }
  };

  // Unique ID for ARIA
  const listboxId = `cmb-list-${label.replace(/\s+/g, "-")}`;

  const displayLabel = (row: WilayahRow & { district_nama?: string; regency_nama?: string }) =>
    renderOption ? renderOption(row) : row.nama;

  return (
    <div className="space-y-1" ref={ref}>
      <label className="text-success text-xxxs uppercase tracking-wider" id={`${listboxId}-label`}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={open && results.length > 0 ? `${listboxId}-opt-${highlightIdx}` : undefined}
          aria-labelledby={`${listboxId}-label`}
          autoComplete="off"
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => {
            if (query.length >= 1) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs h-8.5 rounded-md pl-2 pr-7 focus:border-success/50 focus:ring-1 focus:ring-brand/50 placeholder:text-slate-500 disabled:opacity-40"
        />
        <button
          type="button"
          disabled={disabled}
          className="absolute right-0 top-0 h-full w-7 flex items-center justify-center rounded-r-md hover:bg-slate-800/50 disabled:opacity-40"
          onClick={() => {
            if (results.length === 0) handleInput(query || "");
            setOpen((prev) => !prev);
          }}
        >
          <CaretDown className="h-3.5 w-3.5 text-slate-500" />
        </button>
        {open && results.length > 0 && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-md shadow-lg"
          >
            {results.map((row, i) => (
              <li
                key={row.kode}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={i === highlightIdx}
                className={`px-2.5 py-1.5 text-xxs cursor-pointer ${i === highlightIdx ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(row);
                  setQuery(displayLabel(row as WilayahRow & { district_nama?: string; regency_nama?: string }));
                  setOpen(false);
                }}
                onMouseEnter={() => setHighlightIdx(i)}
              >
                {displayLabel(row as WilayahRow & { district_nama?: string; regency_nama?: string })}
              </li>
            ))}
          </ul>
        )}
        {loading && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xxxs text-slate-600">...</span>}
      </div>
    </div>
  );
}
