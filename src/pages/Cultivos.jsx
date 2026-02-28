import { useState, useEffect } from "react";
import { ref, onValue, set, push, remove } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import {
  FiPlus, FiTrash2, FiCheckCircle, FiEdit2, FiCheck, FiX, FiChevronDown, FiSave
} from "react-icons/fi";
import { PiPlantLight } from "react-icons/pi";

const CROP_EMOJIS = [
  { emoji: "🍅", nombre: "Tomate" },
  { emoji: "🫑", nombre: "Chile" },
  { emoji: "🥒", nombre: "Pepino" },
  { emoji: "🥬", nombre: "Lechuga" },
  { emoji: "🌽", nombre: "Maíz" },
  { emoji: "🥕", nombre: "Zanahoria" },
  { emoji: "🧅", nombre: "Cebolla" },
  { emoji: "🧄", nombre: "Ajo" },
  { emoji: "🥦", nombre: "Brócoli" },
  { emoji: "🍓", nombre: "Fresa" },
  { emoji: "🫛", nombre: "Ejote" },
  { emoji: "🌿", nombre: "Hierbas" },
  { emoji: "🍃", nombre: "Espinaca" },
  { emoji: "🥔", nombre: "Papa" },
  { emoji: "🍆", nombre: "Berenjena" },
  { emoji: "🌱", nombre: "Otro" },
];

const DEFAULT_CONFIG = {
  humedad_min: 40,
  temperatura_max: 35,
  radiacion_max: 900,
  accion_riego: true,
  accion_malla_temp: false,
  accion_malla_rad: false,
};

// ─── Preset card ──────────────────────────────────────────────────────────
function PresetCard({ presetId, preset, onDelete, onEdit }) {
  return (
    <div className="glass rounded-2xl p-5 space-y-4 hover:shadow-lg transition group">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{preset.emoji || "🌱"}</span>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-base">{preset.nombre}</p>
            <p className="text-[11px] text-gray-400">Preset de automatización</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onEdit(presetId, preset)} className="p-1.5 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"><FiEdit2 size={14} /></button>
          <button onClick={() => onDelete(presetId)} className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"><FiTrash2 size={14} /></button>
        </div>
      </div>

      {/* Config values */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2.5">
          <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{preset.humedad_min}%</p>
          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Hum. mín.</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-2.5">
          <p className="text-lg font-extrabold text-orange-600 dark:text-orange-400">{preset.temperatura_max}°C</p>
          <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Temp. máx.</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-2.5">
          <p className="text-lg font-extrabold text-yellow-600 dark:text-yellow-400">{preset.radiacion_max}</p>
          <p className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider">Rad. W/m²</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5">
        {preset.accion_riego && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400">💧 Riego al bajar hum.</span>
        )}
        {preset.accion_malla_temp && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">🛡️ Malla por temp.</span>
        )}
        {preset.accion_malla_rad && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">🛡️ Malla por radiación</span>
        )}
      </div>
    </div>
  );
}

// ─── Preset form ──────────────────────────────────────────────────────────
function PresetForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { nombre: "", emoji: "🌱", ...DEFAULT_CONFIG });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <div className="glass rounded-3xl p-6 border border-emerald-200/50 dark:border-emerald-800/30 space-y-5 animate-fadeUp">
      <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
        <FiPlus className="text-emerald-500" /> {initial ? "Editar preset" : "Nuevo preset de cultivo"}
      </h2>

      {/* Name + emoji */}
      <div className="flex gap-3 items-start">
        <div className="relative">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-14 h-14 text-3xl rounded-2xl bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-emerald-400 transition flex items-center justify-center">
            {form.emoji}
          </button>
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 grid grid-cols-4 gap-1 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl w-52">
              {CROP_EMOJIS.map((c) => (
                <button key={c.emoji} onClick={() => { setForm({ ...form, emoji: c.emoji, nombre: form.nombre || c.nombre }); setShowEmojiPicker(false); }}
                  className="flex flex-col items-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl p-1.5 group transition" title={c.nombre}>
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-[8px] text-gray-400 group-hover:text-emerald-500 leading-none">{c.nombre}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre del cultivo (ej: Tomate Cherry)"
          className="flex-1 h-14 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/40 transition" />
      </div>

      {/* Thresholds */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">💧 Humedad mínima</p>
          <input type="range" min={0} max={100} value={form.humedad_min}
            onChange={(e) => setForm({ ...form, humedad_min: parseInt(e.target.value) })} className="w-full accent-blue-500" />
          <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{form.humedad_min}%</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-orange-600 dark:text-orange-400">🌡️ Temperatura máx.</p>
          <input type="range" min={20} max={50} value={form.temperatura_max}
            onChange={(e) => setForm({ ...form, temperatura_max: parseInt(e.target.value) })} className="w-full accent-orange-500" />
          <p className="text-xl font-extrabold text-orange-600 dark:text-orange-400">{form.temperatura_max}°C</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400">☀️ Radiación máx. W/m²</p>
          <input type="range" min={0} max={1200} value={form.radiacion_max}
            onChange={(e) => setForm({ ...form, radiacion_max: parseInt(e.target.value) })} className="w-full accent-yellow-500" />
          <p className="text-xl font-extrabold text-yellow-600 dark:text-yellow-400">{form.radiacion_max}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones automáticas</p>
        {[
          { key: "accion_riego", label: "💧 Activar riego cuando la humedad baje del mínimo" },
          { key: "accion_malla_temp", label: "🛡️ Activar malla cuando la temperatura supere el máximo" },
          { key: "accion_malla_rad", label: "🛡️ Activar malla cuando la radiación supere el máximo" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer bg-white/50 dark:bg-slate-800/40 rounded-xl px-4 py-2.5 border border-gray-100 dark:border-slate-700 hover:border-emerald-400 transition">
            <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="accent-emerald-500 w-4 h-4" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving || !form.nombre.trim()}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
          <FiSave size={16} /> {saving ? "Guardando..." : "Guardar preset"}
        </button>
        <button onClick={onCancel}
          className="px-5 py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function Cultivos() {
  const { user } = useAuth();
  const [presets, setPresets] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingPreset, setEditingPreset] = useState(null);
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const presetsPath = user ? `usuarios/${user.uid}/cultivoPresets` : null;

  useEffect(() => {
    if (!presetsPath) return;
    const unsub = onValue(ref(db, presetsPath), (snap) => {
      setPresets(snap.val() || {});
    });
    return () => unsub();
  }, [presetsPath]);

  function flash(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function savePreset(form) {
    if (!presetsPath) return;
    if (editingId) {
      await set(ref(db, `${presetsPath}/${editingId}`), form);
      flash("✅ Preset actualizado");
    } else {
      await push(ref(db, presetsPath), form);
      flash("✅ Preset guardado");
    }
    setShowForm(false);
    setEditingId(null);
    setEditingPreset(null);
  }

  async function deletePreset(id) {
    await remove(ref(db, `${presetsPath}/${id}`));
    setConfirmDelete(null);
    flash("🗑️ Preset eliminado");
  }

  function startEdit(id, preset) {
    setEditingId(id);
    setEditingPreset(preset);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const presetEntries = Object.entries(presets);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeUp">
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight flex items-center gap-3">
            <PiPlantLight size={34} className="text-emerald-500" />
            Cultivos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Crea presets de automatización por cultivo y cárgalos en cualquier sección.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setEditingId(null); setEditingPreset(null); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20">
            <FiPlus /> Nuevo preset
          </button>
        )}
      </header>

      {/* Toast */}
      {success && (
        <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 animate-fadeUp">
          <FiCheckCircle className="flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-4xl text-center">⚠️</div>
            <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-200">
              ¿Eliminar el preset <b>"{presets[confirmDelete]?.nombre}"</b>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => deletePreset(confirmDelete)} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-500 transition text-sm">Eliminar</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-600 transition text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <PresetForm
          initial={editingPreset}
          onSave={savePreset}
          onCancel={() => { setShowForm(false); setEditingId(null); setEditingPreset(null); }}
        />
      )}

      {/* How it works */}
      {!showForm && presetEntries.length === 0 && (
        <div className="glass rounded-3xl p-12 text-center space-y-4">
          <div className="text-6xl">🌱</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sin presets aún</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Crea un preset con los umbrales ideales para cada cultivo.
            Luego podrás cargarlo en <b>cualquier sección</b> de cualquier invernadero desde el panel de automatización.
          </p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20">
            <FiPlus /> Crear mi primer preset
          </button>
        </div>
      )}

      {/* Hint */}
      {!showForm && presetEntries.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl px-5 py-3 flex items-start gap-3">
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Para cargar un preset, ve a <b>Invernaderos</b> → selecciona una sección → abre ⚙️ → Modo Automático → selecciona el preset en el desplegable. Si no cargas ninguno, aparecerá como <b>Personalizado</b>.
          </p>
        </div>
      )}

      {/* Preset list */}
      {!showForm && presetEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {presetEntries.map(([id, preset]) => (
            <PresetCard key={id} presetId={id} preset={preset}
              onDelete={(id) => setConfirmDelete(id)}
              onEdit={startEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
