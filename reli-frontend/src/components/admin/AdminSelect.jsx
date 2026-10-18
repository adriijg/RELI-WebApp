export default function AdminSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Selecciona...',
  disabled = false,
  className = '',
  id,
}) {
  const selectId = id || `admin-select-${label ? label.toLowerCase().replace(/\s+/g, '-') : 'field'}`;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value ?? ''}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          className="w-full appearance-none bg-muted/30 border border-card-border rounded-xl pl-4 pr-11 py-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-re-rojo/40 hover:border-re-rojo/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
