import { useEffect, useState } from 'react';
import { uploadImageToSupabase } from '../../services/supabase';

export default function EntityFormModal({ open, title, fields, initialValue, submitLabel = 'Guardar', onSubmit, onClose, extra }) {
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    if (!open) return;
    const defaults = {};
    fields.forEach((field) => {
      const fromInitial = initialValue?.[field.name];
      if (fromInitial !== undefined && fromInitial !== null) {
        defaults[field.name] = fromInitial;
      } else if (field.type === 'checkbox') {
        defaults[field.name] = Boolean(field.default);
      } else if (field.default !== undefined) {
        defaults[field.name] = field.default;
      } else {
        defaults[field.name] = '';
      }
    });
    fields.forEach((field) => {
      if (field.type === 'datetime-local' && typeof defaults[field.name] === 'string') {
        defaults[field.name] = defaults[field.name].slice(0, 16);
      }
    });
    setValues(defaults);
    setError('');
    // Solo reiniciar al abrir o cambiar de registro; fields es estable durante la edición
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValue]);

  if (!open) return null;

  const handleChange = (name, type, checkedOrValue) => {
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checkedOrValue : checkedOrValue,
    }));
    setError('');
  };

  const handleImageUpload = async (field, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading((prev) => ({ ...prev, [field.name]: true }));
    setError('');
    try {
      const publicUrl = await uploadImageToSupabase(file, field.bucket);
      setValues((prev) => ({ ...prev, [field.name]: publicUrl }));
    } catch (err) {
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setUploading((prev) => ({ ...prev, [field.name]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(uploading).some(Boolean)) {
      setError('Espera a que termine la subida de la imagen');
      return;
    }
    const payload = {};
    for (const field of fields) {
      let value = values[field.name];
      if (field.type === 'number') {
        value = value === '' || value === null ? null : Number(value);
      } else if (field.type === 'checkbox') {
        value = Boolean(value);
      }
      if (field.required && (value === '' || value === null || value === undefined)) {
        setError(`El campo "${field.label}" es obligatorio`);
        return;
      }
      payload[field.name] = value;
    }

    setSaving(true);
    setError('');
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Error al guardar');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-card-border rounded-3xl shadow-2xl">
        <div className="sticky top-0 z-10 bg-re-rojo px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Formulario</p>
            <h3 className="text-xl font-black italic tracking-tighter text-white uppercase">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors" aria-label="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
                  {field.label}
                  {field.required && <span className="text-re-rojo"> *</span>}
                </label>

                {field.type === 'select' ? (
                  <div className="relative">
                    <select
                      value={values[field.name] ?? ''}
                      onChange={(e) => handleChange(field.name, 'select', e.target.value)}
                      required={field.required}
                      className="w-full appearance-none bg-muted/30 border border-card-border rounded-xl pl-4 pr-11 py-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-re-rojo/40 transition-all cursor-pointer hover:border-re-rojo/40"
                    >
                      <option value="">{field.placeholder || 'Selecciona...'}</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                ) : field.type === 'combobox' ? (
                  <div>
                    <input
                      list={`datalist-${field.name}`}
                      value={values[field.name] ?? ''}
                      onChange={(e) => handleChange(field.name, 'combobox', e.target.value)}
                      required={field.required}
                      placeholder={field.placeholder}
                      autoComplete="off"
                      className="w-full bg-muted/30 border border-card-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo/40 transition-all"
                    />
                    <datalist id={`datalist-${field.name}`}>
                      {(field.options || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </datalist>
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={values[field.name] ?? ''}
                    onChange={(e) => handleChange(field.name, 'textarea', e.target.value)}
                    required={field.required}
                    rows={4}
                    placeholder={field.placeholder}
                    className="w-full bg-muted/30 border border-card-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo/40 transition-all resize-y"
                  />
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center gap-3 cursor-pointer bg-muted/20 border border-card-border rounded-xl px-4 py-3">
                    <input
                      type="checkbox"
                      checked={Boolean(values[field.name])}
                      onChange={(e) => handleChange(field.name, 'checkbox', e.target.checked)}
                      className="w-4 h-4 accent-[#E21D2C]"
                    />
                    <span className="text-sm font-bold">{field.checkboxLabel || field.label}</span>
                  </label>
                ) : field.type === 'image' ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={values[field.name] ?? ''}
                        onChange={(e) => handleChange(field.name, 'url', e.target.value)}
                        required={field.required}
                        placeholder="https://... o sube un archivo"
                        className="flex-1 min-w-0 bg-muted/30 border border-card-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo/40 transition-all"
                      />
                      <label className={`shrink-0 inline-flex items-center justify-center px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                        uploading[field.name]
                          ? 'opacity-60 cursor-wait border-card-border text-muted-foreground'
                          : 'border-re-rojo/40 text-re-rojo hover:bg-re-rojo/10'
                      }`}>
                        {uploading[field.name] ? 'Subiendo…' : 'Subir'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading[field.name]}
                          onChange={(e) => handleImageUpload(field, e)}
                        />
                      </label>
                    </div>
                    {values[field.name] && (
                      <img
                        src={values[field.name]}
                        alt="Vista previa"
                        className="h-20 w-20 rounded-xl object-cover border border-card-border bg-muted/20"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={values[field.name] ?? ''}
                    onChange={(e) => handleChange(field.name, field.type, e.target.value)}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    placeholder={field.placeholder}
                    className="w-full bg-muted/30 border border-card-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo/40 transition-all"
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-500 text-xs font-bold p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-card-border font-black py-3.5 rounded-xl text-xs tracking-widest uppercase hover:bg-muted/10 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-re-rojo text-white font-black py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : submitLabel}
            </button>
          </div>
        </form>
        {extra && <div className="border-t border-card-border bg-muted/10 p-6">{extra}</div>}
      </div>
    </div>
  );
}
