'use client';

import { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, Upload, CheckCircle, XCircle, Loader2, X, ImageIcon } from 'lucide-react';
import { specificationsData } from '@/utils/specifications';
import { countries, boatConditions, dragonflyModels, currencies as currencyList } from '@/utils/constants';

const PLAN_OPTIONS = [
  { key: 'start-line',  label: 'Start line',  months: 3 },
  { key: 'mid-course',  label: 'Mid-course',  months: 3 },
  { key: 'podium',      label: 'Podium',      months: 4 },
] as const;

function planToMonths(raw: string): string {
  const lower = raw.toLowerCase().trim();
  const match = PLAN_OPTIONS.find(
    (p) => p.key === lower || p.label.toLowerCase() === lower || lower.includes(p.key) || lower.includes(p.label.toLowerCase())
  );
  if (match) return String(match.months);
  const num = parseInt(raw);
  return isNaN(num) ? '3' : String(num);
}

interface BoatRow {
  id: string;
  model: string;
  price: string;
  currency: string;
  country: string;
  condition: string;
  description: string;
  email: string;
  ownerEmail: string;
  vatPaid: boolean;
  photoUrls: string;
  specifications: string;
  expiresMonths: string;

  status?: 'pending' | 'success' | 'error';
  errorMessage?: string;
}

type ImportMode = 'quick' | 'bulk';


function createEmptyRow(): BoatRow {
  return {
    id: Math.random().toString(36).slice(2),
    model: '',
    price: '',
    currency: 'EUR',
    country: '',
    condition: '',
    description: '',
    email: '',
    vatPaid: false,
    ownerEmail: '',
    photoUrls: '',
    specifications: '',
    expiresMonths: '3'
  };
}

// Maps a raw CSV string to a valid option key (tries key → label → partial label)
function matchKey<T extends { key: string; label: string }>(
  options: readonly T[],
  raw: string,
  fallback = ''
): string {
  if (!raw) return fallback;
  const lower = raw.toLowerCase().trim();
  const byKey = options.find((o) => o.key.toLowerCase() === lower);
  if (byKey) return byKey.key;
  const byLabel = options.find((o) => o.label.toLowerCase() === lower);
  if (byLabel) return byLabel.key;
  const byPartial = options.find(
    (o) => lower.includes(o.label.toLowerCase()) || o.label.toLowerCase().includes(lower)
  );
  if (byPartial) return byPartial.key;
  return fallback;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): BoatRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/"/g, ''));
  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const clean = parseCSVLine(line);
    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? (clean[idx] || '') : '';
    };
    return {
      id: Math.random().toString(36).slice(2),
      model: matchKey(dragonflyModels, get('model')),
      price: get('price'),
      currency: matchKey(currencyList, get('currency'), 'EUR'),
      country: matchKey(countries, get('country')),
      condition: matchKey(boatConditions, get('condition')),
      description: get('description'),
      email: get('email'),
      vatPaid: get('vatpaid') === 'true' || get('vat_paid') === 'true',
      ownerEmail: get('owneremail') || get('owner_email'),
      photoUrls: get('photos').replace(/\|/g, ','),
      specifications: get('specifications').replace(/\|/g, ','),
      expiresMonths: planToMonths(get('expires_months') || get('expiresmonths') || get('plan') || '3')
    };
  });
}

async function uploadImages(files: File[], boatId: string): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('boatId', boatId);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const data = await res.json();
      if (data.url) urls.push(data.url);
    }
  }
  return urls;
}

export default function AdminBoatImport() {
  const [mode, setMode] = useState<ImportMode>('quick');

  // Quick create
  const [quick, setQuick] = useState<BoatRow>(createEmptyRow());
  const [quickSpecs, setQuickSpecs] = useState<string[]>([]);
  const [quickFiles, setQuickFiles] = useState<File[]>([]);
  const [quickPreviews, setQuickPreviews] = useState<string[]>([]);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState<{ success: boolean; message: string } | null>(null);
  const quickFileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Bulk
  const [rows, setRows] = useState<BoatRow[]>([createEmptyRow()]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; total: number } | null>(null);
  const [specsPopover, setSpecsPopover] = useState<{ id: string; top: number; left: number } | null>(null);
  const [imagesPopover, setImagesPopover] = useState<{ id: string; top: number; left: number } | null>(null);
  const [rowFiles, setRowFiles] = useState<Record<string, File[]>>({});
  const [rowPreviews, setRowPreviews] = useState<Record<string, string[]>>({});
  const csvFileRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // ---- Image handling (quick) ----

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/') && f.size <= 3 * 1024 * 1024);
    const remaining = 20 - quickFiles.length;
    const toAdd = valid.slice(0, remaining);
    setQuickFiles((prev) => [...prev, ...toAdd]);
    toAdd.forEach((f) => {
      const url = URL.createObjectURL(f);
      setQuickPreviews((prev) => [...prev, url]);
    });
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(quickPreviews[i]);
    setQuickFiles((prev) => prev.filter((_, idx) => idx !== i));
    setQuickPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  // ---- Quick create submit ----

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickLoading(true);
    setQuickResult(null);
    try {
      const res = await fetch('/api/admin/boats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: quick.model,
          price: parseFloat(quick.price),
          currency: quick.currency,
          country: quick.country,
          condition: quick.condition || undefined,
          description: quick.description,
          email: quick.email || undefined,
          vatPaid: quick.vatPaid,
          specifications: quickSpecs,
          ownerEmail: quick.ownerEmail || undefined,
          expiresMonths: parseInt(quick.expiresMonths) || 3
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setQuickResult({ success: false, message: data.error || 'Erreur lors de la création' });
        return;
      }

      const boatId: string = data.boat.id;
      let photoCount = 0;

      if (quickFiles.length > 0) {
        const uploadedUrls = await uploadImages(quickFiles, boatId);
        photoCount = uploadedUrls.length;
        if (uploadedUrls.length > 0) {
          await fetch('/api/admin/boats', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boatId, photos: uploadedUrls })
          });
        }
      }

      const photoMsg = photoCount > 0 ? ` avec ${photoCount} photo(s)` : '';
      setQuickResult({ success: true, message: `Annonce "${quick.model}" publiée${photoMsg} !` });
      setQuick(createEmptyRow());
      setQuickSpecs([]);
      quickPreviews.forEach((url) => URL.revokeObjectURL(url));
      setQuickFiles([]);
      setQuickPreviews([]);
    } catch {
      setQuickResult({ success: false, message: 'Erreur réseau' });
    } finally {
      setQuickLoading(false);
    }
  };

  // ---- Bulk rows ----

  const updateRow = useCallback((id: string, field: keyof BoatRow, value: string | boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value, status: undefined, errorMessage: undefined } : r))
    );
  }, []);

  const addRow = useCallback(() => setRows((prev) => [...prev, createEmptyRow()]), []);

  const removeRow = useCallback(
    (id: string) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev)),
    []
  );

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target?.result as string);
      if (parsed.length > 0) setRows(parsed);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBulkSubmit = async () => {
    setBulkLoading(true);
    setBulkResult(null);
    const boats = rows.map((r) => ({
      model: r.model,
      price: parseFloat(r.price),
      currency: r.currency,
      country: r.country,
      condition: r.condition || undefined,
      description: r.description,
      email: r.email || undefined,
      ownerEmail: r.ownerEmail || undefined,
      vatPaid: r.vatPaid,
      expiresMonths: parseInt(r.expiresMonths) || 3,
      photos: r.photoUrls
        ? r.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
        : [],
      specifications: r.specifications
        ? r.specifications.split(',').map((s) => s.trim()).filter(Boolean)
        : []
    }));
    try {
      const res = await fetch('/api/admin/boats/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boats })
      });
      const data = await res.json();
      if (res.ok) {
        setBulkResult({ created: data.created, total: data.total });

        // Upload images for successfully created boats
        for (const result of (data.results ?? [])) {
          if (result.boatId) {
            const rowId = rows[result.index]?.id;
            const files = rowId ? (rowFiles[rowId] ?? []) : [];
            if (files.length > 0) {
              const uploadedUrls = await uploadImages(files, result.boatId);
              if (uploadedUrls.length > 0) {
                await fetch('/api/admin/boats', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ boatId: result.boatId, photos: uploadedUrls })
                });
              }
            }
          }
        }

        setRows((prev) =>
          prev.map((r, i) => {
            const result = data.results?.find((x: any) => x.index === i);
            if (!result) return r;
            return result.error
              ? { ...r, status: 'error', errorMessage: result.error }
              : { ...r, status: 'success' };
          })
        );
      } else {
        setBulkResult({ created: 0, total: boats.length });
      }
    } catch {
      setBulkResult({ created: 0, total: boats.length });
    } finally {
      setBulkLoading(false);
    }
  };

  const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-articblue/30 focus:border-articblue bg-white';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="space-y-6">
      {/* Mode switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('quick')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'quick' ? 'bg-articblue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Création rapide
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'bulk' ? 'bg-articblue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Import en masse
        </button>
      </div>

      {/* ---- Quick Create ---- */}
      {mode === 'quick' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Nouvelle annonce (publication immédiate)</h3>
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Modèle *</label>
                <select
                  className={inputCls}
                  value={quick.model}
                  onChange={(e) => setQuick((q) => ({ ...q, model: e.target.value }))}
                  required
                >
                  <option value="">— Choisir —</option>
                  {dragonflyModels.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={labelCls}>Prix *</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    step="any"
                    placeholder="85000"
                    value={quick.price}
                    onChange={(e) => setQuick((q) => ({ ...q, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="w-28">
                  <label className={labelCls}>Devise</label>
                  <select
                    className={inputCls}
                    value={quick.currency}
                    onChange={(e) => setQuick((q) => ({ ...q, currency: e.target.value }))}
                  >
                    {currencyList.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Pays *</label>
                <select
                  className={inputCls}
                  value={quick.country}
                  onChange={(e) => setQuick((q) => ({ ...q, country: e.target.value }))}
                  required
                >
                  <option value="">— Choisir —</option>
                  {countries.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Condition</label>
                <select
                  className={inputCls}
                  value={quick.condition}
                  onChange={(e) => setQuick((q) => ({ ...q, condition: e.target.value }))}
                >
                  <option value="">—</option>
                  {boatConditions.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Email de contact (annonce)</label>
                <input
                  className={inputCls}
                  type="email"
                  placeholder="contact@example.com"
                  value={quick.email}
                  onChange={(e) => setQuick((q) => ({ ...q, email: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Email du propriétaire (compte)</label>
                <input
                  className={inputCls}
                  type="email"
                  placeholder="proprietaire@example.com"
                  value={quick.ownerEmail}
                  onChange={(e) => setQuick((q) => ({ ...q, ownerEmail: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-0.5">Crée le compte automatiquement si inexistant et envoie une invitation.</p>
              </div>
              <div>
                <label className={labelCls}>Offre</label>
                <select
                  className={inputCls}
                  value={quick.expiresMonths}
                  onChange={(e) => setQuick((q) => ({ ...q, expiresMonths: e.target.value }))}
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p.key} value={String(p.months)}>
                      {p.label} — {p.months} mois
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <input
                  type="checkbox"
                  id="quick-vat"
                  checked={quick.vatPaid}
                  onChange={(e) => setQuick((q) => ({ ...q, vatPaid: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="quick-vat" className="text-sm text-gray-600">TVA payée</label>
              </div>
            </div>

            <div>
              <label className={labelCls}>Description * (min 20 caractères)</label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={4}
                placeholder="Description détaillée du bateau..."
                value={quick.description}
                onChange={(e) => setQuick((q) => ({ ...q, description: e.target.value }))}
                required
                minLength={20}
                maxLength={2000}
              />
              <div className="text-xs text-gray-400 text-right mt-0.5">{quick.description.length}/2000</div>
            </div>

            <div>
              <label className={labelCls}>
                Caractéristiques ({quickSpecs.length} sélectionnée{quickSpecs.length !== 1 ? 's' : ''})
              </label>
              <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                {specificationsData.map((section) => (
                  <div key={section.title}>
                    <div className="text-xs font-semibold text-gray-500 mb-1.5">{section.title}</div>
                    <div className="flex flex-wrap gap-2">
                      {section.items.map((item) => {
                        const checked = quickSpecs.includes(item.key);
                        return (
                          <label
                            key={item.key}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
                              checked
                                ? 'bg-articblue text-white border-articblue'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-articblue'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={checked}
                              onChange={() =>
                                setQuickSpecs((prev) =>
                                  checked ? prev.filter((k) => k !== item.key) : [...prev, item.key]
                                )
                              }
                            />
                            {item.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className={labelCls}>Photos ({quickFiles.length}/20)</label>
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => quickFileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-articblue hover:bg-blue-50/30 transition-colors"
              >
                <ImageIcon className="mx-auto mb-1 text-gray-300" size={24} />
                <p className="text-xs text-gray-400">
                  Glisser-déposer ou cliquer — JPEG, PNG, WebP — max 3 Mo/image
                </p>
                <input
                  ref={quickFileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>

              {quickPreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {quickPreviews.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {quickResult && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                quickResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {quickResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {quickResult.message}
              </div>
            )}

            <button
              type="submit"
              disabled={quickLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-articblue text-white rounded-lg text-sm font-medium hover:bg-articblue/90 disabled:opacity-60 transition-colors"
            >
              {quickLoading && <Loader2 size={16} className="animate-spin" />}
              {quickLoading
                ? quickFiles.length > 0
                  ? 'Upload en cours…'
                  : 'Publication…'
                : 'Publier l\'annonce'}
            </button>
          </form>
        </div>
      )}

      {/* ---- Bulk Import ---- */}
      {mode === 'bulk' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => csvFileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Upload size={15} />
                Importer CSV
              </button>
              <input ref={csvFileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSV} />
              <span className="text-xs text-gray-400">
                En-têtes CSV : model, price, currency, country, condition, description, email, owner_email, vat_paid, photos, specifications, expires_months
              </span>
            </div>
            <div className="flex items-center gap-2">
              {bulkResult && (
                <span className={`text-sm font-medium ${bulkResult.created === bulkResult.total ? 'text-green-600' : 'text-orange-600'}`}>
                  {bulkResult.created}/{bulkResult.total} créées
                </span>
              )}
              <button
                onClick={handleBulkSubmit}
                disabled={bulkLoading || rows.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-articblue text-white rounded-lg text-sm font-medium hover:bg-articblue/90 disabled:opacity-60 transition-colors"
              >
                {bulkLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Tout publier ({rows.length})
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {rows.map((row, i) => (
              <div
                key={row.id}
                className={`bg-white rounded-xl border p-3 space-y-2 ${
                  row.status === 'success' ? 'border-green-300 bg-green-50' : row.status === 'error' ? 'border-red-300 bg-red-50' : ''
                }`}
              >
                {/* Ligne 1 : identité */}
                <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '20px 1fr 100px 72px 1fr 130px 20px' }}>
                  <span className="text-xs text-gray-400">{i + 1}</span>
                  <select className={inputCls} value={row.model} onChange={(e) => updateRow(row.id, 'model', e.target.value)}>
                    <option value="">— Modèle —</option>
                    {dragonflyModels.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                  <input className={inputCls} type="number" min="0" step="any" placeholder="Prix" value={row.price} onChange={(e) => updateRow(row.id, 'price', e.target.value)} />
                  <select className={inputCls} value={row.currency} onChange={(e) => updateRow(row.id, 'currency', e.target.value)}>
                    {currencyList.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <select className={inputCls} value={row.country} onChange={(e) => updateRow(row.id, 'country', e.target.value)}>
                    <option value="">— Pays —</option>
                    {countries.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <select className={inputCls} value={row.condition} onChange={(e) => updateRow(row.id, 'condition', e.target.value)}>
                    <option value="">— Condition —</option>
                    {boatConditions.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <div>
                    {row.status === 'success' ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : row.status === 'error' ? (
                      <XCircle size={16} className="text-red-500" />
                    ) : (
                      <button onClick={() => removeRow(row.id)} className="text-gray-300 hover:text-red-400 transition-colors" title="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ligne 2 : description, specs, photos, emails */}
                <div className="grid gap-2 items-start" style={{ gridTemplateColumns: '20px 2fr 80px 80px 1fr 1fr 1fr 56px' }}>
                  <span />
                  <div>
                    <input
                      className={inputCls}
                      placeholder="Description * (min 20 car.)"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                    />
                    {row.status === 'error' && row.errorMessage && (
                      <div className="text-xs text-red-600 mt-0.5">{row.errorMessage}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (specsPopover?.id === row.id) { setSpecsPopover(null); return; }
                      const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                      const popoverH = Math.min(480, window.innerHeight - 80);
                      const top = rect.bottom + 4 + popoverH > window.innerHeight ? rect.top - popoverH - 4 : rect.bottom + 4;
                      setSpecsPopover({ id: row.id, top, left: rect.left });
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 bg-white hover:border-articblue transition-colors text-left"
                  >
                    {row.specifications ? `${row.specifications.split(',').filter(Boolean).length} specs` : 'Specs…'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (imagesPopover?.id === row.id) { setImagesPopover(null); return; }
                      const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                      const popoverH = 320;
                      const top = rect.bottom + 4 + popoverH > window.innerHeight ? rect.top - popoverH - 4 : rect.bottom + 4;
                      setImagesPopover({ id: row.id, top, left: Math.max(8, rect.left - 200) });
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 bg-white hover:border-articblue transition-colors text-left"
                  >
                    {(rowFiles[row.id]?.length ?? 0) > 0 ? `${rowFiles[row.id].length} photo(s)` : 'Photos…'}
                  </button>
                  <input className={inputCls} placeholder="URLs photos…" value={row.photoUrls} onChange={(e) => updateRow(row.id, 'photoUrls', e.target.value)} />
                  <input className={inputCls} type="email" placeholder="Email contact" value={row.email} onChange={(e) => updateRow(row.id, 'email', e.target.value)} />
                  <input className={inputCls} type="email" placeholder="Email propriétaire" value={row.ownerEmail} onChange={(e) => updateRow(row.id, 'ownerEmail', e.target.value)} title="Crée le compte et envoie une invitation si inexistant" />
                  <select
                    className={inputCls}
                    value={row.expiresMonths}
                    title="Offre"
                    onChange={(e) => updateRow(row.id, 'expiresMonths', e.target.value)}
                  >
                    {PLAN_OPTIONS.map((p) => (
                      <option key={p.key} value={String(p.months)}>
                        {p.label} ({p.months}m)
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <input type="checkbox" id={`vat-${row.id}`} checked={row.vatPaid} onChange={(e) => updateRow(row.id, 'vatPaid', e.target.checked)} className="rounded border-gray-300" />
                    <label htmlFor={`vat-${row.id}`} className="text-xs text-gray-500">TVA</label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addRow}
            className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-articblue hover:text-articblue transition-colors w-full justify-center"
          >
            <Plus size={15} />
            Ajouter une ligne
          </button>
        </div>
      )}

      {/* Specs popover — fixed, hors du tableau */}
      {specsPopover && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setSpecsPopover(null)} />
          <div
            className="fixed z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3 flex flex-col"
            style={{ top: specsPopover.top, left: specsPopover.left, maxHeight: Math.min(480, window.innerHeight - 80) }}
          >
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <span className="text-xs font-semibold text-gray-700">Caractéristiques</span>
              <button
                type="button"
                onClick={() => setSpecsPopover(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
            <div className="overflow-y-auto space-y-3">
            {specificationsData.map((section) => {
              const row = rows.find((r) => r.id === specsPopover.id);
              if (!row) return null;
              return (
                <div key={section.title}>
                  <div className="text-xs font-semibold text-gray-500 mb-1.5">{section.title}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {section.items.map((item) => {
                      const selected = row.specifications
                        ? row.specifications.split(',').map((s) => s.trim()).includes(item.key)
                        : false;
                      return (
                        <label
                          key={item.key}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer border transition-colors ${
                            selected
                              ? 'bg-articblue text-white border-articblue'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-articblue'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={selected}
                            onChange={() => {
                              const current = row.specifications
                                ? row.specifications.split(',').map((s) => s.trim()).filter(Boolean)
                                : [];
                              const next = selected
                                ? current.filter((k) => k !== item.key)
                                : [...current, item.key];
                              updateRow(row.id, 'specifications', next.join(','));
                            }}
                          />
                          {item.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </>
      )}

      {/* Images popover — fixed, hors du tableau */}
      {imagesPopover && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setImagesPopover(null)} />
          <div
            className="fixed z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-3 flex flex-col gap-3"
            style={{ top: imagesPopover.top, left: imagesPopover.left }}
          >
            <div className="flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-semibold text-gray-700">
                Photos ({rowFiles[imagesPopover.id]?.length ?? 0}/20)
              </span>
              <button type="button" onClick={() => setImagesPopover(null)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>

            {/* Drop zone */}
            <div
              onDrop={(e) => {
                e.preventDefault();
                const id = imagesPopover.id;
                const existing = rowFiles[id] ?? [];
                const valid = Array.from(e.dataTransfer.files)
                  .filter((f) => f.type.startsWith('image/') && f.size <= 3 * 1024 * 1024)
                  .slice(0, 20 - existing.length);
                if (!valid.length) return;
                setRowFiles((prev) => ({ ...prev, [id]: [...existing, ...valid] }));
                setRowPreviews((prev) => ({
                  ...prev,
                  [id]: [...(prev[id] ?? []), ...valid.map((f) => URL.createObjectURL(f))]
                }));
              }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => bulkFileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:border-articblue hover:bg-blue-50/30 transition-colors"
            >
              <ImageIcon className="mx-auto mb-1 text-gray-300" size={20} />
              <p className="text-xs text-gray-400">Glisser ou cliquer — max 3 Mo/image</p>
              <input
                ref={bulkFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  const id = imagesPopover.id;
                  const existing = rowFiles[id] ?? [];
                  const valid = Array.from(e.target.files ?? [])
                    .filter((f) => f.type.startsWith('image/') && f.size <= 3 * 1024 * 1024)
                    .slice(0, 20 - existing.length);
                  if (!valid.length) return;
                  setRowFiles((prev) => ({ ...prev, [id]: [...existing, ...valid] }));
                  setRowPreviews((prev) => ({
                    ...prev,
                    [id]: [...(prev[id] ?? []), ...valid.map((f) => URL.createObjectURL(f))]
                  }));
                  e.target.value = '';
                }}
              />
            </div>

            {/* Previews */}
            {(rowPreviews[imagesPopover.id]?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {(rowPreviews[imagesPopover.id] ?? []).map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const id = imagesPopover.id;
                        URL.revokeObjectURL(url);
                        setRowFiles((prev) => ({ ...prev, [id]: (prev[id] ?? []).filter((_, idx) => idx !== i) }));
                        setRowPreviews((prev) => ({ ...prev, [id]: (prev[id] ?? []).filter((_, idx) => idx !== i) }));
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
