import { Fragment, useState, useEffect, useRef, useMemo } from 'react';
import { supabase, type Department, type Personnel, type TimesheetEntry, type Holiday, type PersonnelType } from './lib/supabase';
import {
  Calendar, Download, RefreshCw, UserPlus, Users,
  ChevronLeft, ChevronRight, Printer, Pencil, Check, X,
  FileSignature, HardDriveDownload, Trash2, RotateCcw, Plus
} from 'lucide-react';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function dayName(year: number, month: number, day: number) {
  return DAYS_TR[new Date(year, month, day).getDay()];
}
function isWeekendDay(year: number, month: number, day: number) {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
}
function isWorkDay(type: PersonnelType, year: number, month: number, day: number) {
  const d = new Date(year, month, day).getDay();
  if (type === 'ISCI') {
    return d !== 0; // İşçi 6 gün çalışır: Pazartesi - Cumartesi
  }
  return d !== 0 && d !== 6; // Memur 5 gün çalışır: Pazartesi - Cuma
}
function buildWeeks(year: number, month: number, daysInMonth: number): number[][] {
  const weeks: number[][] = [];
  let week: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (new Date(year, month, d).getDay() === 0 || d === daysInMonth) {
      weeks.push(week);
      week = [];
    }
  }
  return weeks;
}
function dailyHours(type: PersonnelType) { return type === 'ISCI' ? 7.5 : 8; }

// ── Personel Ekle Modal ──
function AddPersonnelModal({
  onAdd, onClose,
}: {
  onAdd: (name: string, type: PersonnelType, phone?: string | null) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PersonnelType>('MEMUR');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onAdd(name.trim().toUpperCase(), type, phone.trim() || null);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-white/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-sky-400" /> Personel Ekle
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white/50 text-xs block mb-1">Ad Soyad</label>
            <input
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="AD SOYAD"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="text-white/50 text-xs block mb-1">Cep Telefonu</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="5xx xxx xx xx"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="text-white/50 text-xs block mb-2">Personel Sınıfı</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setType('MEMUR')}
                className={`py-3 rounded-xl border text-sm font-medium transition ${
                  type === 'MEMUR'
                    ? 'bg-sky-500/30 border-sky-400 text-sky-200'
                    : 'bg-white/5 border-white/15 text-white/50 hover:border-white/30'
                }`}>
                <div className="text-base font-bold mb-0.5">Memur</div>
                <div className="text-[10px] opacity-70">40 saat / hafta</div>
              </button>
              <button
                onClick={() => setType('ISCI')}
                className={`py-3 rounded-xl border text-sm font-medium transition ${
                  type === 'ISCI'
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                    : 'bg-white/5 border-white/15 text-white/50 hover:border-white/30'
                }`}>
                <div className="text-base font-bold mb-0.5">İşçi</div>
                <div className="text-[10px] opacity-70">45 saat / hafta</div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-white/50 hover:text-white text-sm">İptal</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition">
            <Check className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Departman Ekle Modal ──
function AddDepartmentModal({
  onAdd, onClose,
}: {
  onAdd: (name: string, services: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [services, setServices] = useState('');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onAdd(name.trim(), services.trim());
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-white/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-300" /> Departman Ekle
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-white/50 text-xs block mb-1">Departman Adı</label>
            <input
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Departman adı"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs block mb-1">Servisler</label>
            <input
              value={services}
              onChange={e => setServices(e.target.value)}
              placeholder="Servisleri virgülle girin"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-400"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-white/50 hover:text-white text-sm">İptal</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition">
            <Check className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Personel Yönetim Modal ──
function PersonnelManageModal({
  deptId, deptName, departments, onClose, onRefresh,
}: {
  deptId: string; deptName: string; departments: Department[];
  onClose: () => void; onRefresh: () => void;
}) {
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('personnel').select('*')
      .order('is_active', { ascending: false })
      .order('name')
      .then(({ data }) => setAllPersonnel(data || []));
  }, [deptId]);

  async function updatePerson(personId: string, fields: Partial<Personnel>) {
    await supabase.from('personnel').update(fields).eq('id', personId);
    setAllPersonnel(prev => prev.map(p => p.id === personId ? { ...p, ...fields } : p));
    onRefresh();
  }

  function updateLocalPerson(personId: string, fields: Partial<Personnel>) {
    setAllPersonnel(prev => prev.map(p => p.id === personId ? { ...p, ...fields } : p));
  }

  async function handleDepartmentChange(person: Personnel, department_id: string) {
    await updatePerson(person.id, { department_id });
  }

  async function handleContactSave(person: Personnel, field: 'phone' | 'email', value: string) {
    await updatePerson(person.id, { [field]: value.trim() || null });
  }

  async function toggleActive(person: Personnel) {
    await supabase.from('personnel').update({ is_active: !person.is_active }).eq('id', person.id);
    setAllPersonnel(prev => prev.map(p => p.id === person.id ? { ...p, is_active: !p.is_active } : p));
    onRefresh();
  }

  async function toggleType(person: Personnel) {
    const newType: PersonnelType = person.personnel_type === 'ISCI' ? 'MEMUR' : 'ISCI';
    await supabase.from('personnel').update({ personnel_type: newType }).eq('id', person.id);
    setAllPersonnel(prev => prev.map(p => p.id === person.id ? { ...p, personnel_type: newType } : p));
    onRefresh();
  }

  function startEdit(person: Personnel) {
    setEditingId(person.id);
    setEditName(person.name);
    setTimeout(() => editRef.current?.select(), 30);
  }

  async function saveEdit(person: Personnel) {
    const trimmed = editName.trim().toUpperCase();
    if (trimmed && trimmed !== person.name) {
      await supabase.from('personnel').update({ name: trimmed }).eq('id', person.id);
      setAllPersonnel(prev => prev.map(p => p.id === person.id ? { ...p, name: trimmed } : p));
      onRefresh();
    }
    setEditingId(null);
  }

  const active = allPersonnel.filter(p => p.is_active);
  const inactive = allPersonnel.filter(p => !p.is_active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-white/20 rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" /> Personel Yönetimi
            <span className="text-white/40 text-xs font-normal">— {deptName}</span>
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-1 pr-1">
          {/* Aktif personel */}
          {active.length > 0 && (
            <>
              <div className="text-[10px] text-white/30 uppercase tracking-wider px-1 py-2">Aktif Personel ({active.length})</div>
              {active.map(person => (
                <div key={person.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/[0.08] transition">
                  {/* Tip rozeti */}
                  <button
                    onClick={() => toggleType(person)}
                    title="Tıkla: İşçi/Memur değiştir"
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 transition hover:opacity-70 ${
                      person.personnel_type === 'ISCI'
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                        : 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
                    }`}>
                    {person.personnel_type === 'ISCI' ? 'İşçi' : 'Memur'}
                  </button>

                  {/* İsim — isme tıklayarak veya kalem ikonuyla düzenle */}
                  {editingId === person.id ? (
                    <input
                      ref={editRef}
                      value={editName}
                      onChange={e => setEditName(e.target.value.toUpperCase())}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(person); if (e.key === 'Escape') setEditingId(null); }}
                      onBlur={() => saveEdit(person)}
                      autoFocus
                      className="flex-1 bg-white/10 border border-sky-400 rounded-lg px-2 py-1 text-white text-sm outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(person)}
                      className="flex-1 text-left text-white text-sm hover:text-sky-300 transition cursor-text"
                      title="İsmi düzenlemek için tıkla">
                      {person.name}
                    </button>
                  )}

                  {/* Aksiyonlar */}
                  <div className="flex flex-col gap-2 flex-1 min-w-[220px]">
                    <div>
                      <select
                        value={person.department_id}
                        onChange={e => handleDepartmentChange(person, e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-white text-sm outline-none focus:border-sky-400"
                      >
                        {departments.map(d => (
                          <option key={d.id} value={d.id} className="bg-slate-950 text-white">{d.name || 'İsimsiz departman'}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={person.phone || ''}
                        onChange={e => updateLocalPerson(person.id, { phone: e.target.value })}
                        onBlur={e => handleContactSave(person, 'phone', e.currentTarget.value)}
                        placeholder="Telefon"
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-sky-400"
                      />
                      <input
                        value={person.email || ''}
                        onChange={e => updateLocalPerson(person.id, { email: e.target.value })}
                        onBlur={e => handleContactSave(person, 'email', e.currentTarget.value)}
                        placeholder="E-posta"
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(person)} title="İsmi düzenle"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-sky-500/30 text-white hover:text-sky-200 text-xs font-medium transition">
                      <Pencil className="w-3 h-3" /> Düzenle
                    </button>
                    <button onClick={() => toggleActive(person)} title="Listeden çıkar"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-medium transition">
                      <Trash2 className="w-3 h-3" /> Çıkar
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Pasif personel */}
          {inactive.length > 0 && (
            <>
              <div className="text-[10px] text-white/20 uppercase tracking-wider px-1 py-2 mt-2">Pasif / Çıkarılmış ({inactive.length})</div>
              {inactive.map(person => (
                <div key={person.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] opacity-60 hover:opacity-90 transition">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 bg-white/10 text-white/30 border border-white/10">
                    {person.personnel_type === 'ISCI' ? 'İşçi' : 'Memur'}
                  </span>
                  <span className="flex-1 text-white/50 text-sm line-through">{person.name}</span>
                  <button onClick={() => toggleActive(person)} title="Tekrar aktif et"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-medium transition">
                    <RotateCcw className="w-3 h-3" /> Aktive Et
                  </button>
                </div>
              ))}
            </>
          )}

          {allPersonnel.length === 0 && (
            <div className="text-center text-white/30 text-sm py-8">Bu departmanda personel bulunmuyor.</div>
          )}
        </div>

        <div className="pt-3 border-t border-white/10 mt-3 text-xs text-white/25">
          Tip rozetine tıklayarak İşçi/Memur değiştirebilirsiniz. Çıkarılan personel pasife alınır, puantaj geçmişi korunur.
        </div>
      </div>
    </div>
  );
}

// ── İmza Modal ──
function SignatureModal({
  dept, onSave, onClose,
}: {
  dept: Department;
  onSave: (f: { hemsire_unvan: string; sorumlu_hemsire: string; saglik_bakim_muduru: string; bashekim: string }) => void;
  onClose: () => void;
}) {
  const [unvan, setUnvan] = useState(dept.hemsire_unvan || '');
  const [hemsire, setHemsire] = useState(dept.sorumlu_hemsire || '');
  const [mudur, setMudur] = useState(dept.saglik_bakim_muduru || '');
  const [bashekim, setBashekim] = useState(dept.bashekim || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-sky-400" /> İmza Bilgileri
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
            <p className="text-white/40 text-[10px] uppercase tracking-wider">Sol Alt (Hemşire)</p>
            <div>
              <label className="text-white/50 text-xs block mb-1">Başlık (Unvan)</label>
              <input value={unvan} onChange={e => setUnvan(e.target.value.toUpperCase())}
                placeholder="örn: CERRAHİ 1-2 SORUMLU HEMŞİRESİ"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky-400" />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Ad Soyad</label>
              <input value={hemsire} onChange={e => setHemsire(e.target.value.toUpperCase())}
                placeholder="Ad Soyad"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky-400" />
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Orta Alt — SAĞLIK BAKIM HİZ. MÜDÜRÜ</p>
            <input value={mudur} onChange={e => setMudur(e.target.value.toUpperCase())}
              placeholder="Ad Soyad"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky-400" />
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Sağ Alt — BAŞHEKİM</p>
            <input value={bashekim} onChange={e => setBashekim(e.target.value.toUpperCase())}
              placeholder="Ad Soyad"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky-400" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-white/50 hover:text-white text-sm">İptal</button>
          <button onClick={() => onSave({ hemsire_unvan: unvan, sorumlu_hemsire: hemsire, saglik_bakim_muduru: mudur, bashekim })}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition">
            <Check className="w-4 h-4" /> Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Düzenlenebilir alan ──
function EditableField({
  value, onSave, placeholder, className = '',
}: {
  value: string; onSave: (v: string) => void;
  placeholder?: string; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  function start() { setDraft(value); setEditing(true); setTimeout(() => ref.current?.select(), 30); }
  function save() { onSave(draft.trim().toUpperCase()); setEditing(false); }
  if (editing) {
    return (
      <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        onBlur={save} placeholder={placeholder} autoFocus
        className={`bg-white/10 border border-sky-400 rounded-lg px-2 py-0.5 text-white text-sm outline-none min-w-[180px] ${className}`} />
    );
  }
  return (
    <button onClick={start} className={`flex items-center gap-1.5 group transition ${className}`}>
      <span className={value ? 'text-white/85 font-medium' : 'text-white/30 italic text-sm'}>{value || (placeholder || 'Tıklayın...')}</span>
      <Pencil className="w-3 h-3 text-white/25 opacity-0 group-hover:opacity-100 transition" />
    </button>
  );
}

// ── Ana Bileşen ──
export default function App() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [loading, setLoading] = useState(true);
  const [hourDrafts, setHourDrafts] = useState<Record<string, string>>({});

  const [showSigModal, setShowSigModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptMenuOpen, setDeptMenuOpen] = useState(false);

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const allDays = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const weeks = useMemo(() => buildWeeks(year, month, daysInMonth), [year, month, daysInMonth]);
  const holidayMap = useMemo(() => new Map(holidays.map(h => [h.holiday_date, h.name])), [holidays]);
  const dept = useMemo(() => departments.find(d => d.id === selectedDept), [departments, selectedDept]);
  const filteredPersonnel = useMemo(() => {
    return personnel
      .filter(p => p.department_id === selectedDept)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
  }, [personnel, selectedDept]);
  const requiredDays = useMemo(() => allDays.filter(d => !isWeekendDay(year, month, d) && !holidayMap.has(fmt(d))).length, [allDays, year, month, holidayMap]);
  const totalHours = useMemo(() => filteredPersonnel.reduce((s, p) => s + monthStats(p).worked, 0), [filteredPersonnel, entries, year, month, holidayMap, allDays]);

  function fmt(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  function isHoliday(d: number) { return holidayMap.has(fmt(d)); }
  function holidayLabel(d: number) { return holidayMap.get(fmt(d)) || ''; }

  function draftKey(personId: string, day: number) {
    return `${personId}_${day}`;
  }

  function formatHourValue(hours: number) {
    if (!hours) return '';
    return String(hours).replace('.', ',');
  }

  function parseHourValue(value: string) {
    const normalized = value.replace(',', '.').trim();
    if (!normalized) return 0;
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? NaN : Math.round(parsed * 100) / 100;
  }

  function getDraftValue(personId: string, day: number) {
    const key = draftKey(personId, day);
    return key in hourDrafts ? hourDrafts[key] : formatHourValue(getHours(personId, day));
  }

  function setDraftValue(personId: string, day: number, value: string) {
    const key = draftKey(personId, day);
    setHourDrafts(prev => ({ ...prev, [key]: value }));
  }

  async function commitHour(personId: string, day: number, value?: string) {
    const key = draftKey(personId, day);
    const draft = value ?? hourDrafts[key];
    if (draft === undefined) return;
    const success = await updateHours(personId, day, draft);
    if (success) {
      setHourDrafts(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function getEntry(personId: string, day: number) {
    return entries.find(e => e.personnel_id === personId && e.entry_date === fmt(day));
  }

  function isBayramEntry(personId: string, day: number) {
    return getEntry(personId, day)?.shift_type === 'BAYRAM';
  }

  function weekBayram(personId: string, wk: number[]) {
    return wk.reduce((sum, d) => {
      const entry = getEntry(personId, d);
      return sum + (entry?.shift_type === 'BAYRAM' ? entry.hours_worked : 0);
    }, 0);
  }

  function monthStats(person: Personnel) {
    const dh = dailyHours(person.personnel_type);
    const required = allDays.filter(d => isWorkDay(person.personnel_type, year, month, d) && !isHoliday(d)).length * dh;
    const worked = allDays.reduce((s, d) => s + getHours(person.id, d), 0);
    const workDays = allDays.filter(d => getHours(person.id, d) > 0).length;
    const bayram = allDays.reduce((s, d) => {
      const entry = getEntry(person.id, d);
      return s + (entry?.shift_type === 'BAYRAM' ? entry.hours_worked : 0);
    }, 0);
    return { required, worked, workDays, diff: worked - required, bayram };
  }

  async function toggleBayram(personId: string, day: number) {
    const entry = getEntry(personId, day);
    if (!entry) return;
    const nextType = entry.shift_type === 'BAYRAM' ? 'MANUAL' : 'BAYRAM';
    await supabase.from('timesheet_entries').update({ shift_type: nextType }).eq('id', entry.id);
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, shift_type: nextType } : e));
  }

  useEffect(() => {
    async function boot() {
      const [deptRes, persRes, holRes] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('personnel').select('*').eq('is_active', true),
        supabase.from('holidays').select('*'),
      ]);
      const depts = deptRes.data || [];
      setDepartments(depts);
      setPersonnel(persRes.data || []);
      setHolidays(holRes.data || []);
      if (depts.length > 0) setSelectedDept(depts[0].id);
      setLoading(false);
    }
    boot();
  }, []);

  async function loadEntries(deptId: string, yr: number, mo: number, pers: Personnel[]) {
    const dim = new Date(yr, mo + 1, 0).getDate();
    const ids = pers.filter(p => p.department_id === deptId).map(p => p.id);
    if (ids.length === 0) { setEntries([]); return; }
    const { data } = await supabase.from('timesheet_entries').select('*')
      .in('personnel_id', ids)
      .gte('entry_date', `${yr}-${String(mo + 1).padStart(2, '0')}-01`)
      .lte('entry_date', `${yr}-${String(mo + 1).padStart(2, '0')}-${dim}`);
    setEntries(data || []);
  }

  useEffect(() => {
    if (selectedDept && personnel.length > 0) loadEntries(selectedDept, year, month, personnel);
  }, [selectedDept, year, month, personnel]);

  const deptName = dept?.name || '';

  async function updateDeptField(fields: Partial<Department>) {
    if (!selectedDept) return;
    await supabase.from('departments').update(fields).eq('id', selectedDept);
    setDepartments(prev => prev.map(d => d.id === selectedDept ? { ...d, ...fields } : d));
  }

  function getHours(personId: string, day: number): number {
    const entry = entries.find(e => e.personnel_id === personId && e.entry_date === fmt(day));
    if (!entry) return 0;
    const hours = entry.hours_worked;
    if (typeof hours === 'string') return parseFloat(hours) || 0;
    return hours || 0;
  }

  function weekRequired(wk: number[], type: PersonnelType) {
    return wk.filter(d => isWorkDay(type, year, month, d) && !isHoliday(d)).length * dailyHours(type);
  }

  function weekWorked(personId: string, wk: number[]) {
    return wk.reduce((s, d) => s + getHours(personId, d), 0);
  }

  async function updateHours(personId: string, day: number, val: string) {
    const trimmed = val.trim();
    const hours = parseHourValue(val);
    const date = fmt(day);
    const existing = entries.find(e => e.personnel_id === personId && e.entry_date === date);
    const isHolidayEntry = isHoliday(day);
    const nextShiftType = isHolidayEntry ? 'BAYRAM' : 'MANUAL';

    if (!trimmed) {
      if (existing) {
        const { error } = await supabase.from('timesheet_entries').delete().eq('id', existing.id);
        if (error) return false;
        setEntries(prev => prev.filter(e => e.id !== existing.id));
      }
      return true;
    }

    if (Number.isNaN(hours) || hours < 0) {
      return false;
    }

    if (hours === 0 && existing) {
      const { error } = await supabase.from('timesheet_entries').delete().eq('id', existing.id);
      if (error) return false;
      setEntries(prev => prev.filter(e => e.id !== existing.id));
      return true;
    }

    if (hours > 0 && existing) {
      const updatedFields: Record<string, unknown> = { hours_worked: hours };
      if (isHolidayEntry && existing.shift_type !== 'BAYRAM') {
        updatedFields.shift_type = 'BAYRAM';
      }
      const { error } = await supabase.from('timesheet_entries').update(updatedFields).eq('id', existing.id);
      if (error) return false;
      setEntries(prev => prev.map(e => e.id === existing.id ? { ...e, ...updatedFields } as TimesheetEntry : e));
      return true;
    }

    if (hours > 0) {
      const { data, error } = await supabase.from('timesheet_entries')
        .insert({ personnel_id: personId, entry_date: date, shift_type: nextShiftType, hours_worked: hours })
        .select().single();
      if (error || !data) return false;
      setEntries(prev => [...prev, data]);
      return true;
    }

    return false;
  }

  async function togglePersonnelType(person: Personnel) {
    const newType: PersonnelType = person.personnel_type === 'ISCI' ? 'MEMUR' : 'ISCI';
    await supabase.from('personnel').update({ personnel_type: newType }).eq('id', person.id);
    setPersonnel(prev => prev.map(p => p.id === person.id ? { ...p, personnel_type: newType } : p));
  }

  async function saveSignatures(fields: { hemsire_unvan: string; sorumlu_hemsire: string; saglik_bakim_muduru: string; bashekim: string }) {
    await updateDeptField(fields);
    setShowSigModal(false);
  }

  function refreshPersonnel() {
    supabase.from('personnel').select('*').eq('is_active', true)
      .then(({ data }) => {
        const next = data || [];
        setPersonnel(next);
        if (selectedDept) loadEntries(selectedDept, year, month, next);
      });
  }

  function exportCSV() {
    const header = ['Personel', 'Sınıf'];
    weeks.forEach((wk, wi) => {
      wk.forEach(d => header.push(String(d)));
      header.push(`H${wi + 1} Ger.`, `H${wi + 1} Çal.`, `H${wi + 1} Fark`, `H${wi + 1} Bayram`);
    });
    header.push('Ay Ger.', 'Ay Çal.', 'Gün', 'Fark', 'Ay Bayram');
    const rows = [header, ...filteredPersonnel.map(p => {
      const row = [p.name, p.personnel_type === 'ISCI' ? 'İşçi' : 'Memur'];
      weeks.forEach(wk => {
        wk.forEach(d => row.push(String(getHours(p.id, d) || '')));
        const r = weekRequired(wk, p.personnel_type), w = weekWorked(p.id, wk), b = weekBayram(p.id, wk);
        row.push(String(r), String(w), String(w - r), String(b));
      });
      const ms = monthStats(p);
      row.push(String(ms.required), String(ms.worked), String(ms.workDays), String(ms.diff), String(ms.bayram));
      return row;
    })];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8;' }));
    a.download = `puantaj_${deptName}_${MONTHS[month]}_${year}.csv`;
    a.click();
  }

  async function exportProjectData() {
    const [allEntries, allPersonnel, allDepts, allHolidays] = await Promise.all([
      supabase.from('timesheet_entries').select('*'),
      supabase.from('personnel').select('*'),
      supabase.from('departments').select('*'),
      supabase.from('holidays').select('*'),
    ]);
    const backup = {
      exportDate: new Date().toISOString(),
      departments: allDepts.data,
      personnel: allPersonnel.data,
      timesheet_entries: allEntries.data,
      holidays: allHolidays.data,
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    a.download = `puantaj_yedek_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  const printWeeks1 = weeks.slice(0, 3);
  const printWeeks2 = weeks.slice(3);

  function renderTableHead(displayWeeks: number[][], showMonthly: boolean) {
    return (
      <thead>
        <tr className="border-b border-white/10 print:border-gray-300">
          <th className="sticky-name text-left px-2 py-1 text-white/40 print:text-gray-600">Personel</th>
          {displayWeeks.map(wk => {
            const globalWi = weeks.indexOf(wk);
            return (
              <Fragment key={`grp-${globalWi}`}>
                {wk.map(d => (
                  <th key={`d1-${d}`} title={holidayLabel(d)}
                    className={`day-col text-center ${
                      isHoliday(d) ? 'text-rose-400 print:text-red-600' :
                      isWeekendDay(year, month, d) ? 'text-amber-400 print:text-orange-600' :
                      'text-white/40 print:text-gray-500'
                    }`}>
                    <div className="font-semibold">{d}</div>
                    <div className="day-name opacity-60">{dayName(year, month, d)}</div>
                  </th>
                ))}
                <th colSpan={4} className="week-summary-header text-sky-400 print:text-blue-700 border-l-2 border-white/20 print:border-gray-400">
                  {globalWi + 1}. Hafta
                </th>
              </Fragment>
            );
          })}
          {showMonthly && (
            <th colSpan={5} className="month-summary-header text-amber-400 print:text-orange-700 border-l-2 border-white/20 print:border-gray-400">
              Aylık Özet
            </th>
          )}
        </tr>
        <tr className="border-b border-white/10 print:border-gray-300">
          <th className="sticky-name" />
          {displayWeeks.map(wk => {
            const globalWi = weeks.indexOf(wk);
            return (
              <Fragment key={`sub-${globalWi}`}>
                {wk.map(d => (
                  <th key={`d2-${d}`} className={`day-col ${
                    isHoliday(d) ? 'bg-rose-500/10 print:bg-red-50' :
                    isWeekendDay(year, month, d) ? 'bg-amber-500/10 print:bg-orange-50' : ''
                  }`} />
                ))}
                <th className="week-sum-col text-sky-300 print:text-blue-700 border-l-2 border-white/15 print:border-gray-400">Gereken</th>
                <th className="week-sum-col text-emerald-300 print:text-green-700">Çalışılan</th>
                <th className="week-sum-col text-white/40 print:text-gray-500">Fark</th>
                <th className="week-sum-col text-amber-300 print:text-orange-700">Bayram</th>
              </Fragment>
            );
          })}
          {showMonthly && (
            <>
              <th className="month-sum-col text-sky-300 print:text-blue-700 border-l-2 border-white/15 print:border-gray-400">Gereken</th>
              <th className="month-sum-col text-emerald-300 print:text-green-700">Çalışılan</th>
              <th className="month-sum-col text-white/40 print:text-gray-500">Gün</th>
              <th className="month-sum-col text-amber-300 print:text-orange-700">Fark</th>
              <th className="month-sum-col text-rose-500 print:text-red-700">Bayram</th>
            </>
          )}
        </tr>
      </thead>
    );
  }

  function renderTableBody(displayWeeks: number[][], showMonthly: boolean, isPrint = false) {
    if (filteredPersonnel.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={99} className="py-8 text-center text-white/30 text-sm">
              Bu departmanda personel yok. "Personel Ekle" ile ekleyebilirsiniz.
            </td>
          </tr>
        </tbody>
      );
    }
    return (
      <tbody>
        {filteredPersonnel.map(person => {
          const ms = monthStats(person);
          const isIsci = person.personnel_type === 'ISCI';
          return (
            <tr key={person.id} className="border-b border-white/5 print:border-gray-200 hover:bg-white/[0.03] transition">
              <td className="sticky-name px-2 py-0.5 print:text-gray-900">
                <div className="flex items-center gap-1">
                  {!isPrint && (
                    <button onClick={() => togglePersonnelType(person)}
                      title={`${isIsci ? 'İşçi (45sa/hf)' : 'Memur (40sa/hf)'} — tıkla değiştir`}
                      className={`text-[8px] font-bold px-1 py-0.5 rounded shrink-0 transition hover:opacity-70 ${
                        isIsci ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                      {isIsci ? 'İ' : 'M'}
                    </button>
                  )}
                  <span className="text-white print:text-gray-900">{person.name}</span>
                </div>
              </td>
              {displayWeeks.map(wk => {
                const globalWi = weeks.indexOf(wk);
                const wReq = weekRequired(wk, person.personnel_type);
                const wWrk = weekWorked(person.id, wk);
                const wDiff = wWrk - wReq;
                return (
                  <Fragment key={`row-${person.id}-wk${globalWi}`}>
                    {wk.map(d => {
                      const hol = isHoliday(d);
                      const wknd = isWeekendDay(year, month, d);
                      const isBayram = isBayramEntry(person.id, d);
                      return (
                        <td key={`c-${person.id}-${d}`} className={`relative p-0.5 ${isBayram ? 'ring-2 ring-rose-400/60' : ''} ${hol ? 'bg-rose-500/10 print:bg-red-50' : wknd ? 'bg-amber-500/10 print:bg-orange-50' : ''}`}>
                          <input type="text" value={getDraftValue(person.id, d)}
                            onChange={e => setDraftValue(person.id, d, e.target.value)}
                            onBlur={e => commitHour(person.id, d, e.currentTarget.value)}
                            onDoubleClick={() => toggleBayram(person.id, d)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                commitHour(person.id, d, e.currentTarget.value);
                                e.currentTarget.blur();
                              }
                              if (e.key === 'Escape') {
                                setDraftValue(person.id, d, getHours(person.id, d) ? formatHourValue(getHours(person.id, d)) : '');
                                e.currentTarget.blur();
                              }
                            }}
                            title={`${d} ${dayName(year, month, d)}${holidayLabel(d) ? ' — ' + holidayLabel(d) : ''}${isBayram ? ' — Bayram mesaisi' : ''}`}
                            className={`day-input text-center rounded border transition focus:outline-none focus:border-sky-400 ${
                              isBayram ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' :
                              hol ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 print:bg-white print:border-red-300 print:text-red-800' :
                              wknd ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 print:bg-white print:border-orange-300 print:text-orange-800' :
                              'bg-white/10 border-white/15 text-white print:bg-white print:border-gray-300 print:text-gray-900'
                            }`} />
                          {isBayram && (
                            <span className="absolute top-0 right-0 text-[8px] leading-none px-0.5 py-0.5 rounded-bl bg-rose-500/90 text-white">B</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="week-sum-td text-sky-300 print:text-blue-700 border-l-2 border-white/15 print:border-gray-300">{wReq}</td>
                    <td className={`week-sum-td ${wWrk >= wReq ? 'text-emerald-400 print:text-green-800' : 'text-rose-400 print:text-red-700'}`}>{wWrk}</td>
                    <td className={`week-sum-td ${wDiff >= 0 ? 'text-emerald-400 print:text-green-800' : 'text-rose-400 print:text-red-700'}`}>
                      {wDiff > 0 ? `+${wDiff}` : wDiff}
                    </td>
                    <td className="week-sum-td text-rose-400 print:text-red-700">{weekBayram(person.id, wk)}</td>
                  </Fragment>
                );
              })}
              {showMonthly && (
                <>
                  <td className="month-sum-td text-sky-300 print:text-blue-700 border-l-2 border-white/15 print:border-gray-300">{ms.required}</td>
                  <td className={`month-sum-td font-semibold ${ms.worked >= ms.required ? 'text-emerald-400 print:text-green-800' : 'text-rose-400 print:text-red-700'}`}>{ms.worked}</td>
                  <td className="month-sum-td text-white/60 print:text-gray-600">{ms.workDays}</td>
                  <td className={`month-sum-td font-semibold ${ms.diff >= 0 ? 'text-emerald-400 print:text-green-800' : 'text-rose-400 print:text-red-700'}`}>
                    {ms.diff > 0 ? `+${ms.diff}` : ms.diff}
                  </td>
                  <td className="month-sum-td text-rose-400 print:text-red-700">{ms.bayram}</td>
                </>
              )}
            </tr>
          );
        })}
      </tbody>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-white/50 text-sm">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showSigModal && dept && <SignatureModal dept={dept} onSave={saveSignatures} onClose={() => setShowSigModal(false)} />}
      {showManageModal && (
        <PersonnelManageModal
          deptId={selectedDept} deptName={deptName} departments={departments}
          onClose={() => setShowManageModal(false)}
          onRefresh={refreshPersonnel}
        />
      )}
      {showAddModal && (
        <AddPersonnelModal onAdd={async (name, type, phone) => {
          await supabase.from('personnel').insert({ name, personnel_type: type, phone: phone || null, department_id: selectedDept || null, is_active: true });
          refreshPersonnel();
          setShowAddModal(false);
        }} onClose={() => setShowAddModal(false)} />
      )}
      {showDeptModal && (
        <AddDepartmentModal onAdd={async (name, services) => {
          const { data: inserted } = await supabase.from('departments').insert({ name, services, manager_name: null, sorumlu_hemsire: null, hemsire_unvan: null, saglik_bakim_muduru: null, bashekim: null }).select('*').single();
          if (inserted) {
            setDepartments(prev => [...prev, inserted]);
            setSelectedDept(inserted.id);
          }
          setShowDeptModal(false);
        }} onClose={() => setShowDeptModal(false)} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 md:p-5 print:bg-white print:p-1 print:min-h-0">
        <div className="max-w-full mx-auto">
          {/* Üst Başlık (sadece başlık ve tarih) */}
          <div className="bg-white/5 rounded-xl p-3 mb-3 border border-white/10 print:hidden">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-sky-400" /> Personel Puantaj Sistemi
                  </h1>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => setDeptMenuOpen(open => !open)}
                    className="relative px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm border border-slate-700 transition flex items-center gap-2">
                    <span className="font-medium">Departmanlar</span>
                    <span className="text-slate-300 text-xs">{deptName || 'Seçiniz'}</span>
                  </button>
                  <button onClick={() => setShowDeptModal(true)}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 rounded-lg border border-emerald-400/20 transition flex items-center gap-1.5 text-sm">
                    <Plus className="w-4 h-4" /> Departman Ekle
                  </button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <EditableField value={deptName} onSave={v => updateDeptField({ name: v })} placeholder="Departman adı..." className="min-w-[200px]" />
                  <span className="text-white/30">—</span>
                  <EditableField
                    value={dept?.services || ''}
                    onSave={v => updateDeptField({ services: v })}
                    placeholder="Servisleri virgülle girin"
                    className="min-w-[250px] text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                    className="p-1.5 bg-slate-800/70 hover:bg-slate-700 rounded-lg text-white/70 transition">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-white text-sm min-w-[140px] text-center">{MONTHS[month]} {year}</div>
                  <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                    className="p-1.5 bg-slate-800/70 hover:bg-slate-700 rounded-lg text-white/70 transition">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            {deptMenuOpen && (
              <div className="mt-3 rounded-xl border border-white/10 bg-slate-950 shadow-2xl p-3 text-white text-sm max-h-[280px] overflow-y-auto">
                <div className="mb-2 font-semibold">Departman Seçimi</div>
                <div className="grid gap-2">
                  {departments.map(deptItem => (
                    <button key={deptItem.id}
                      onClick={() => { setSelectedDept(deptItem.id); setDeptMenuOpen(false); }}
                      className={`text-left rounded-lg px-3 py-2 transition ${deptItem.id === selectedDept ? 'bg-slate-800 border border-sky-500/40' : 'bg-slate-900 hover:bg-slate-800'}`}>
                      <div className="font-medium text-white">{deptItem.name || 'İsimsiz departman'}</div>
                      <div className="text-xs text-slate-400 mt-1">{deptItem.services || 'Servis yok'}</div>
                    </button>
                  ))}
                  {departments.length === 0 && <div className="text-slate-400">Henüz departman yok. Departman ekleyin.</div>}
                </div>
              </div>
            )}
          </div>

          {/* ── İSTATİSTİKLER ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 print:hidden">
            {[
              { label: 'Aktif Personel', val: filteredPersonnel.length, color: 'text-white' },
              { label: 'Toplam Çalışılan', val: `${totalHours} sa`, color: 'text-sky-400' },
              { label: 'İş Günü', val: requiredDays, color: 'text-emerald-400' },
              {
                label: 'İşçi / Memur',
                val: `${filteredPersonnel.filter(p => p.personnel_type === 'ISCI').length} / ${filteredPersonnel.filter(p => p.personnel_type === 'MEMUR').length}`,
                color: 'text-amber-400',
              },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                <div className={`text-xl font-semibold ${s.color}`}>{s.val}</div>
                <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── AÇIKLAMA ── */}
          <div className="bg-white/5 rounded-xl p-2.5 mb-3 border border-white/10 flex flex-wrap gap-4 text-xs text-white/45 print:hidden">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400/30" /> Hafta Sonu</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-400/30" /> Resmi Tatil</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">İ</span>
              İşçi (45sa/hf)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">M</span>
              Memur (40sa/hf) — ismin solundaki rozete tıkla değiştir
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">B</span>
              Bayram mesaisi — hücrede çift tıkla
            </span>
          </div>

          {/* ── EKRAN TABLOSU ── */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden print:hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse puantaj-table">
                {renderTableHead(weeks, true)}
                {renderTableBody(weeks, true, false)}
              </table>
            </div>
          </div>

          {/* ── PRINT TABLOLARI ── */}
          <div className="hidden print:block">
            <div className="mb-1 text-center">
              <div className="text-[9px] font-bold text-gray-800 uppercase tracking-wide">
                {deptName} — {MONTHS[month]} {year} Puantaj Cetveli
              </div>
            </div>
            <table className="w-full border-collapse puantaj-table">
              {renderTableHead(printWeeks1, true)}
              {renderTableBody(printWeeks1, true, true)}
            </table>
            {printWeeks2.length > 0 && (
              <table className="w-full border-collapse puantaj-table print-table-2">
                {renderTableHead(printWeeks2, false)}
                {renderTableBody(printWeeks2, false, true)}
              </table>
            )}
            <div className="mt-4 pt-3 border-t border-gray-300">
              <div className="flex justify-between items-start text-[8px] text-gray-800">
                <div className="text-left">
                  <div className="font-bold uppercase">{dept?.hemsire_unvan || ''}</div>
                  <div className="mt-4 font-semibold">{dept?.sorumlu_hemsire || ''}</div>
                </div>
                <div className="text-center">
                  <div className="font-bold uppercase">SAĞLIK BAKIM HİZ. MÜDÜRÜ</div>
                  <div className="mt-4 font-semibold">{dept?.saglik_bakim_muduru || ''}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold uppercase">BAŞHEKİM</div>
                  <div className="mt-4 font-semibold">{dept?.bashekim || ''}</div>
                </div>
              </div>
            </div>
            <div className="mt-1 text-[6px] text-gray-400 text-center">
              {deptName} · {MONTHS[month]} {year} · {new Date().toLocaleDateString('tr-TR')}
            </div>
          </div>

          {/* ── ALT ALAN ── */}
          <div className="flex justify-between items-center mt-3 print:hidden">
            <div className="text-xs text-white/25 flex gap-4">
              {dept?.hemsire_unvan && <span>{dept.hemsire_unvan}: {dept.sorumlu_hemsire}</span>}
              {dept?.saglik_bakim_muduru && <span>SBH: {dept.saglik_bakim_muduru}</span>}
              {dept?.bashekim && <span>Başhekim: {dept.bashekim}</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg border border-white/20 transition flex items-center gap-1.5 text-sm">
                <UserPlus className="w-4 h-4" /> Personel Ekle
              </button>
              <button onClick={() => setShowSigModal(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg border border-white/20 transition flex items-center gap-1.5 text-sm">
                <FileSignature className="w-4 h-4" /> İmzalar
              </button>
              <button onClick={() => setShowManageModal(true)}
                className="px-3 py-1.5 bg-sky-500/25 hover:bg-sky-500/40 text-sky-300 rounded-lg border border-sky-500/40 transition flex items-center gap-1.5 text-sm">
                <Users className="w-4 h-4" /> Personel Atama
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
