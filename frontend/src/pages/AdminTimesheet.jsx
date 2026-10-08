import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const monthNames = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

const formatHM = (H) => {
  if (!H || H <= 0) return '0h';
  const total = Math.round(H * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
};

const getDaysInPeriod = (periodStart) => {
  const year = periodStart.getFullYear();
  const month = periodStart.getMonth();
  const start = new Date(year, month, 20);
  const end = new Date(year, month + 1, 20);
  const days = [];
  let cur = new Date(start);
  while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return days;
};

const toKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const calcStats = (days, periodDays) => {
  let hours = 0, transport = 0, pay = 0;
  periodDays.forEach(d => {
    const key = toKey(d);
    const val = days[key];
    if (!val) return;
    const h = typeof val === 'object' ? (Number(val.hours) || 0) : (parseFloat(val) || 0);
    const simH = typeof val === 'object' ? (Number(val.simulatedHours) || (val.isSimulated ? Number(val.hours) || 0 : 0)) : 0;
    const tOnly = typeof val === 'object' ? !!val.transportOnly : false;
    hours += (h + simH);
    pay += Math.round(h * 700) + (simH * 400);
    if (h > 0 || simH > 0 || tOnly) transport += 200;
  });
  const total = pay + transport;
  return { hours, transport, total, workedDays: Math.round(transport / 200) };
};

// ─── Export all to Excel (one sheet per stagiaire) ───────────────────────────
const buildExcelBlob = (allData, periodDays, periodStart) => {
  const startMo = periodStart.getMonth();
  const endMo = (startMo + 1) % 12;
  const endYr = startMo === 11 ? periodStart.getFullYear() + 1 : periodStart.getFullYear();
  const periodLabel = `${monthNames[startMo].slice(0,3)}→${monthNames[endMo].slice(0,3)} ${endYr}`;

  const enc = new TextEncoder();
  const toBin8 = s => enc.encode(s);

  const rows = [['Stagiaire', 'Email', 'Heures', 'Jours', 'Transport (DH)', 'Total (DH)']];
  allData.forEach(({ user, days }) => {
    if (!user) return;
    const { hours, transport, total, workedDays } = calcStats(days, periodDays);
    rows.push([user.name || '-', user.email || '-', hours.toFixed(2), workedDays, transport, total]);
  });

  let sheetRows = `<row r="1">${rows[0].map((h,i)=>`<c r="${String.fromCharCode(65+i)}1" t="inlineStr"><is><t>${h}</t></is></c>`).join('')}</row>`;
  rows.slice(1).forEach((row, ri) => {
    const rn = ri + 2;
    sheetRows += `<row r="${rn}">${row.map((v,i) => {
      const col = String.fromCharCode(65 + i);
      return typeof v === 'number' ? `<c r="${col}${rn}" t="n"><v>${v}</v></c>` : `<c r="${col}${rn}" t="inlineStr"><is><t>${String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</t></is></c>`;
    }).join('')}</row>`;
  });

  const sheetXml = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`;
  const wbXml = `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${periodLabel}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const wbRels = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const ct = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;

  const files = [
    { name: '[Content_Types].xml', data: toBin8(ct) },
    { name: '_rels/.rels', data: toBin8(rels) },
    { name: 'xl/workbook.xml', data: toBin8(wbXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: toBin8(wbRels) },
    { name: 'xl/worksheets/sheet1.xml', data: toBin8(sheetXml) },
  ];

  const u16 = n => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b; };
  const u32 = n => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b; };
  const cat = (...arrs) => { const t = arrs.reduce((s,a)=>s+a.length,0); const o = new Uint8Array(t); let off=0; arrs.forEach(a=>{o.set(a,off);off+=a.length;}); return o; };
  const crc = buf => { let c=0xFFFFFFFF; const t=Array.from({length:256},(_,i)=>{let v=i;for(let j=0;j<8;j++)v=(v&1)?(0xEDB88320^(v>>>1)):(v>>>1);return v;}); for(const b of buf)c=t[(c^b)&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; };

  const lhs = []; let off = 0; const cd = [];
  files.forEach(({name,data:fd}) => {
    const nb = enc.encode(name); const cr = crc(fd);
    const lh = cat(new Uint8Array([0x50,0x4B,0x03,0x04]),u16(20),u16(0),u16(0),u16(0),u16(0),u32(cr),u32(fd.length),u32(fd.length),u16(nb.length),u16(0),nb,fd);
    lhs.push(lh); cd.push({nb,cr,size:fd.length,off}); off+=lh.length;
  });
  const cde = cd.map(({nb,cr,size,off:o})=>cat(new Uint8Array([0x50,0x4B,0x01,0x02]),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(cr),u32(size),u32(size),u16(nb.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(o),nb));
  const cdb = cat(...cde);
  const eocd = cat(new Uint8Array([0x50,0x4B,0x05,0x06]),u16(0),u16(0),u16(files.length),u16(files.length),u32(cdb.length),u32(off),u16(0));
  return new Blob([cat(...lhs,cdb,eocd)], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
};

// ─── Stats Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color }) => (
  <div className={`${color} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
    <div className="relative z-10">
      <p className="text-white/70 text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-black">{value}</p>
      {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
    </div>
    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white opacity-10 rounded-full blur-2xl"/>
  </div>
);

// ─── User Row ─────────────────────────────────────────────────────────────────
const UserRow = ({ ts, periodDays, onClick, selected }) => {
  const { user, days, updatedAt } = ts;
  if (!user) return null;
  const { hours, transport, total, workedDays } = calcStats(days, periodDays);
  const initials = user.name ? user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : '?';
  const lastSync = updatedAt ? new Date(updatedAt).toLocaleDateString('fr-FR') : '-';

  return (
    <tr
      onClick={() => onClick(ts)}
      className={`cursor-pointer border-b border-gray-100 dark:border-gray-700 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 transition-colors ${selected ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
    >
      <td className="px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{user.name}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
        {formatHM(hours)}
      </td>
      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300">
        {workedDays} j
      </td>
      <td className="px-4 py-3 text-center text-sm text-amber-600 dark:text-amber-400 font-medium">
        {transport.toLocaleString('fr-FR')} DH
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
          {total.toLocaleString('fr-FR')} DH
        </span>
      </td>
      <td className="px-4 py-3 text-center text-xs text-gray-400">{lastSync}</td>
    </tr>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ ts, periodDays, onClose }) => {
  if (!ts) return null;
  const { user, days } = ts;
  const { hours, transport, total } = calcStats(days, periodDays);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg">
              {user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">{user?.name}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold">×</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6">
          <div className="text-center bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Heures</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatHM(hours)}</p>
          </div>
          <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Transport</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{transport.toLocaleString('fr-FR')} DH</p>
          </div>
          <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{total.toLocaleString('fr-FR')} DH</p>
          </div>
        </div>

        {/* Day-by-day */}
        <div className="px-6 pb-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Détail par jour</h3>
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {periodDays.map(d => {
              const key = toKey(d);
              const val = days[key];
              if (!val) return null;
              const h = typeof val === 'object' ? (Number(val.hours)||0) : (parseFloat(val)||0);
              const tOnly = typeof val === 'object' ? !!val.transportOnly : false;
              if (h === 0 && !tOnly) return null;
              const dayLabel = d.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' });
              const dailyTotal = Math.round(h*700) + 200;
              return (
                <div key={key} className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                  <span className="text-gray-600 dark:text-gray-300 capitalize">{dayLabel}</span>
                  <div className="flex gap-4 items-center">
                    {tOnly && !h ? (
                      <span className="text-amber-500 text-xs font-bold">🚗 Transport seul</span>
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formatHM(h)}</span>
                    )}
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">{dailyTotal} DH</span>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminTimesheet = () => {
  const { user } = useAuth();
  const [periodStart, setPeriodStart] = useState(() => {
    const now = new Date();
    const day = now.getDate();
    const m = day < 20 ? now.getMonth() - 1 : now.getMonth();
    return new Date(now.getFullYear(), m < 0 ? 11 : m, 20);
  });
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTs, setSelectedTs] = useState(null);

  const periodDays = getDaysInPeriod(periodStart);
  const startM = monthNames[periodStart.getMonth()];
  const endM = monthNames[(periodStart.getMonth() + 1) % 12];
  const startY = periodStart.getFullYear();
  const endY = periodStart.getMonth() === 11 ? startY + 1 : startY;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/timesheet/admin/all');
      if (res.success) setAllData(res.data);
    } catch (e) {
      toast.error('Impossible de charger les pointages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = allData.filter(ts => {
    if (!ts.user) return false;
    const q = search.toLowerCase();
    return !q || ts.user.name?.toLowerCase().includes(q) || ts.user.email?.toLowerCase().includes(q);
  });

  // Global stats
  const totalHours = filtered.reduce((s, ts) => s + calcStats(ts.days, periodDays).hours, 0);
  const totalTransport = filtered.reduce((s, ts) => s + calcStats(ts.days, periodDays).transport, 0);
  const totalGeneral = filtered.reduce((s, ts) => s + calcStats(ts.days, periodDays).total, 0);

  const handleExport = () => {
    const blob = buildExcelBlob(filtered, periodDays, periodStart);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pointage_admin_${startM}_${endY}.xlsx`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Export Excel téléchargé !');
  };

  const prevPeriod = () => {
    const y = periodStart.getFullYear();
    const m = periodStart.getMonth() - 1;
    setPeriodStart(new Date(y, m < 0 ? 11 : m, 20));
  };
  const nextPeriod = () => {
    const y = periodStart.getFullYear();
    const m = periodStart.getMonth() + 1;
    setPeriodStart(new Date(y, m > 11 ? 0 : m, 20));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-xl"/>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_,i) => <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-700"/>)}
        </div>
        <div className="h-72 rounded-2xl bg-gray-100 dark:bg-gray-800"/>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <ClockIcon className="w-8 h-8 text-indigo-500"/> Tableau de bord Pointage
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Vue globale des heures de tous les stagiaires</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition-colors"
        >
          <ArrowDownTrayIcon className="w-5 h-5"/> Export Excel
        </button>
      </div>

      {/* Period Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={prevPeriod} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 transition-colors">
            <ChevronLeftIcon className="w-5 h-5"/>
          </button>
          <span className="text-lg font-bold text-gray-900 dark:text-white min-w-[220px] text-center">
            {startM} {startY} → {endM} {endY}
          </span>
          <button onClick={nextPeriod} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 transition-colors">
            <ChevronRightIcon className="w-5 h-5"/>
          </button>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
          {filtered.length} stagiaire{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Heures (tous)" value={formatHM(totalHours)} sub={`${filtered.length} stagiaires actifs`} color="bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-200 dark:shadow-none"/>
        <StatCard label="Total Transport" value={`${totalTransport.toLocaleString('fr-FR')} DH`} sub="200 DH/jour travaillé" color="bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200 dark:shadow-none"/>
        <StatCard label="Total Général" value={`${totalGeneral.toLocaleString('fr-FR')} DH`} sub="Heures + transport combinés" color="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200 dark:shadow-none"/>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                {['Stagiaire','Rôle','Heures','Jours','Transport','Total','Dernière sync'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <UserCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                    <p>Aucun stagiaire trouvé</p>
                  </td>
                </tr>
              ) : (
                filtered.map((ts, i) => (
                  <UserRow
                    key={ts.user?._id || i}
                    ts={ts}
                    periodDays={periodDays}
                    onClick={setSelectedTs}
                    selected={selectedTs?.user?._id === ts.user?._id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTs && (
        <DetailModal ts={selectedTs} periodDays={periodDays} onClose={() => setSelectedTs(null)}/>
      )}
    </div>
  );
};

export default AdminTimesheet;
