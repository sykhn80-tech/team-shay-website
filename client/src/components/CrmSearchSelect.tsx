import Select, { type GroupBase, type StylesConfig } from "react-select";
import CreatableSelect from "react-select/creatable";
import type { CrmOption } from "@/lib/crm-options";

type CrmSearchSelectProps = {
  value: string | number | null | undefined;
  options: Array<CrmOption | { value: number; label: string }>;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  isClearable?: boolean;
  isCreatable?: boolean;
  className?: string;
};

type CrmMultiSearchSelectProps = {
  value: string[];
  options: CrmOption[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  isCreatable?: boolean;
  className?: string;
};

type AnyOption = { value: string | number; label: string };

const crmSelectStyles: StylesConfig<AnyOption, boolean, GroupBase<AnyOption>> = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 8,
    border: `1.5px solid ${state.isFocused ? "#D4AF37" : "#D4AF37"}`,
    background: "#FAFAFA",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(212, 175, 55, 0.2)" : "none",
    fontSize: 14,
    direction: "rtl",
    cursor: "pointer",
    "&:hover": { borderColor: "#D4AF37" },
  }),
  valueContainer: base => ({ ...base, padding: "2px 14px" }),
  input: base => ({ ...base, color: "#1A1A1A", direction: "rtl" }),
  singleValue: base => ({ ...base, color: "#1A1A1A", fontWeight: 700 }),
  placeholder: base => ({ ...base, color: "#64748b" }),
  menu: base => ({ ...base, zIndex: 80, borderRadius: 10, overflow: "hidden", direction: "rtl" }),
  menuList: base => ({ ...base, padding: 6 }),
  option: (base, state) => ({
    ...base,
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: state.isSelected ? 800 : 600,
    color: state.isSelected ? "#1A1A1A" : "#334155",
    background: state.isSelected ? "#D4AF37" : state.isFocused ? "rgba(212, 175, 55, 0.14)" : "white",
  }),
  multiValue: base => ({ ...base, borderRadius: 999, background: "rgba(212, 175, 55, 0.18)" }),
  multiValueLabel: base => ({ ...base, color: "#1A1A1A", fontWeight: 700 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: base => ({ ...base, color: "#B58B2A" }),
};

export function CrmSearchSelect({
  value,
  options,
  onChange,
  placeholder = "בחרו אפשרות",
  isClearable = true,
  isCreatable = false,
  className,
}: CrmSearchSelectProps) {
  const selected = options.find(option => String(option.value) === String(value ?? "")) ?? null;
  const Component = isCreatable ? CreatableSelect : Select;

  return (
    <Component<AnyOption, false>
      className={className}
      options={options}
      value={selected}
      onChange={option => onChange(option?.value ?? null)}
      placeholder={placeholder}
      noOptionsMessage={() => "לא נמצאו תוצאות"}
      formatCreateLabel={input => `הוספת "${input}"`}
      isClearable={isClearable}
      isSearchable
      styles={crmSelectStyles as StylesConfig<AnyOption, false>}
    />
  );
}

export function CrmMultiSearchSelect({
  value,
  options,
  onChange,
  placeholder = "בחרו אפשרויות",
  isCreatable = false,
  className,
}: CrmMultiSearchSelectProps) {
  const selected = options.filter(option => value.includes(option.value));
  const Component = isCreatable ? CreatableSelect : Select;

  return (
    <Component<CrmOption, true>
      className={className}
      options={options}
      value={selected}
      onChange={items => onChange(items.map(item => item.value))}
      placeholder={placeholder}
      noOptionsMessage={() => "לא נמצאו תוצאות"}
      formatCreateLabel={input => `הוספת "${input}"`}
      isMulti
      isSearchable
      styles={crmSelectStyles as StylesConfig<CrmOption, true>}
    />
  );
}
