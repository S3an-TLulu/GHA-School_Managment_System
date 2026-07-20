import { useEffect, useRef } from 'react';
import { Palette, Monitor, Layout, Image as ImageIcon, Upload, Ban } from 'lucide-react';
import { useAppContext, AppTheme } from '../context/AppContext';
import { compressImage } from '../lib/images';

// Bundled wallpapers shipped with the app (public/photos). Stored as
// 'stock:<name>' so the URL survives a change of deployment base path.
const STOCK_WALLPAPERS = [
  { id: 'stock:gha-family', label: 'GHA Family' },
  { id: 'stock:learners-1', label: 'Our Learners' },
  { id: 'stock:learners-2', label: 'Side by Side' },
  { id: 'stock:learners-3', label: 'Bright Start' },
];

export function resolveWallpaperUrl(wallpaper: string): string {
  if (wallpaper.startsWith('stock:')) {
    return `${import.meta.env.BASE_URL}photos/${wallpaper.slice(6)}.jpg`;
  }
  return wallpaper;
}

const SCHEMES: { id: AppTheme['colorScheme']; label: string; primary: string; accent: string; preview: string }[] = [
  { id: 'blue',   label: 'Ocean Blue',   primary: '#1d4ed8', accent: '#3b82f6', preview: 'bg-blue-600' },
  { id: 'green',  label: 'Forest Green', primary: '#15803d', accent: '#22c55e', preview: 'bg-green-600' },
  { id: 'purple', label: 'Royal Purple', primary: '#7c3aed', accent: '#a78bfa', preview: 'bg-purple-600' },
  { id: 'orange', label: 'Sunset Orange',primary: '#c2410c', accent: '#f97316', preview: 'bg-orange-600' },
  { id: 'red',    label: 'Classic Red',  primary: '#b91c1c', accent: '#ef4444', preview: 'bg-red-600' },
];

function applyTheme(theme: AppTheme) {
  const scheme = SCHEMES.find(s => s.id === theme.colorScheme) || SCHEMES[0];

  let styleEl = document.getElementById('gha-theme-override') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'gha-theme-override';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    :root {
      --gha-primary: ${scheme.primary};
      --gha-accent: ${scheme.accent};
    }
    .gha-active-nav {
      background-color: color-mix(in srgb, ${scheme.primary} 10%, white) !important;
      color: ${scheme.primary} !important;
      border-color: color-mix(in srgb, ${scheme.primary} 30%, white) !important;
    }
    .gha-primary-btn {
      background-color: ${scheme.primary} !important;
    }
    .gha-primary-btn:hover {
      background-color: color-mix(in srgb, ${scheme.primary} 80%, black) !important;
    }
    ${theme.darkMode ? `
    body { background-color: #0f172a !important; color: #f1f5f9 !important; }
    .bg-white { background-color: #1e293b !important; }
    .bg-gray-50 { background-color: #0f172a !important; }
    .bg-gray-100 { background-color: #1e293b !important; }
    .border-gray-200 { border-color: #334155 !important; }
    .border-gray-300 { border-color: #475569 !important; }
    .border-gray-100 { border-color: #1e293b !important; }
    .text-gray-900 { color: #f1f5f9 !important; }
    .text-gray-800 { color: #e2e8f0 !important; }
    .text-gray-700 { color: #cbd5e1 !important; }
    .text-gray-600 { color: #94a3b8 !important; }
    .text-gray-500 { color: #64748b !important; }
    .text-gray-400 { color: #94a3b8 !important; }
    .divide-gray-200 > * { border-color: #334155 !important; }
    .divide-gray-100 > * { border-color: #1e293b !important; }
    input, select, textarea {
      background-color: #0f172a !important;
      color: #f1f5f9 !important;
      border-color: #475569 !important;
    }
    input::placeholder, textarea::placeholder { color: #64748b !important; }
    option { background-color: #1e293b !important; color: #f1f5f9 !important; }
    /* Hover/selection highlights: light-tint classes flip to a dark tint so
       text stays readable when hovering or selecting rows in dark mode */
    .hover\\:bg-gray-50:hover, .hover\\:bg-gray-100:hover,
    .hover\\:bg-blue-50:hover, .hover\\:bg-amber-50:hover,
    .hover\\:bg-green-100:hover, .hover\\:bg-white:hover {
      background-color: #334155 !important;
    }
    .bg-gray-50\\/40, .bg-green-50\\/40, .bg-blue-50\\/50 { background-color: #1e293b !important; }
    ::selection { background-color: #2563eb !important; color: #ffffff !important; }
    thead.bg-gray-50 th, tr.bg-gray-50 th, .bg-gray-50 th { background-color: #1e293b !important; color: #cbd5e1 !important; }
    ` : ''}
    ${theme.wallpaper ? (() => {
      // Fade the wallpaper towards the normal page colour so content stays
      // readable; the app shell goes transparent to let it show through.
      const dim = Math.min(95, Math.max(0, theme.wallpaperDim ?? 75)) / 100;
      const tint = theme.darkMode ? `rgba(15,23,42,${dim})` : `rgba(243,244,246,${dim})`;
      const url = resolveWallpaperUrl(theme.wallpaper).replace(/"/g, '%22');
      return `
    body {
      background-image: linear-gradient(${tint}, ${tint}), url("${url}") !important;
      background-size: cover !important;
      background-position: center !important;
      background-attachment: fixed !important;
    }
    .gha-shell { background-color: transparent !important; }
      `;
    })() : ''}
  `;

  if (theme.darkMode) {
    document.documentElement.setAttribute('data-dark', 'true');
  } else {
    document.documentElement.removeAttribute('data-dark');
  }
}

export function ThemeManager() {
  const { theme, updateTheme, galleryPhotos } = useAppContext();
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { applyTheme(theme); }, [theme]);

  const current = SCHEMES.find(s => s.id === theme.colorScheme) || SCHEMES[0];
  const wallpaper = theme.wallpaper || '';
  const dim = theme.wallpaperDim ?? 75;

  const setWallpaper = (w: string) => updateTheme({ wallpaper: w });

  const uploadWallpaper = async (file: File | undefined) => {
    if (!file) return;
    try {
      // Wallpapers can afford a larger size than profile photos, but still
      // need to fit comfortably in localStorage / cloud sync as JSON.
      const dataUrl = await compressImage(file, 1600, 0.75);
      setWallpaper(dataUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not read that image.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Theme Manager</h1>
        <p className="text-gray-600">Customise the look and feel of your school management system</p>
      </div>

      {/* Colour Schemes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center space-x-2 mb-4">
          <Palette className="h-4 w-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Colour Scheme</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SCHEMES.map(scheme => (
            <button key={scheme.id} onClick={() => { updateTheme({ colorScheme: scheme.id }); applyTheme({ ...theme, colorScheme: scheme.id }); }}
              className={`relative rounded-xl border-2 p-4 flex flex-col items-center space-y-2 transition-all ${
                theme.colorScheme === scheme.id
                  ? 'border-gray-900 shadow-md scale-105'
                  : 'border-gray-200 hover:border-gray-400'
              }`}>
              <div className={`w-10 h-10 rounded-full ${scheme.preview} shadow-inner`} />
              <span className="text-xs font-medium text-gray-700">{scheme.label}</span>
              {theme.colorScheme === scheme.id && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">Current: <strong>{current.label}</strong></p>
      </div>

      {/* Display Mode */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center space-x-2 mb-4">
          <Monitor className="h-4 w-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Display Mode</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {[
            { id: false, label: 'Light Mode', icon: '☀️', desc: 'Bright, clean interface' },
            { id: true,  label: 'Dark Mode',  icon: '🌙', desc: 'Easy on the eyes at night' },
          ].map(opt => (
            <button key={String(opt.id)} onClick={() => { updateTheme({ darkMode: opt.id }); applyTheme({ ...theme, darkMode: opt.id }); }}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                theme.darkMode === opt.id ? 'border-gray-900 bg-gray-50 shadow-md' : 'border-gray-200 hover:border-gray-400'
              }`}>
              <p className="text-xl mb-1">{opt.icon}</p>
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Layout */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center space-x-2 mb-4">
          <Layout className="h-4 w-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Sidebar Style</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {[
            { id: 'default' as const, label: 'Full Labels', desc: 'Icons with text labels' },
            { id: 'compact' as const, label: 'Compact',     desc: 'Icons only, save space' },
          ].map(opt => (
            <button key={opt.id} onClick={() => updateTheme({ sidebarStyle: opt.id })}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                theme.sidebarStyle === opt.id ? 'border-gray-900 bg-gray-50 shadow-md' : 'border-gray-200 hover:border-gray-400'
              }`}>
              <div className={`mb-2 flex ${opt.id === 'compact' ? 'gap-1' : 'flex-col gap-1'}`}>
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-300" />
                    {opt.id === 'default' && <div className="w-10 h-2 rounded bg-gray-200" />}
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Background wallpaper */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center space-x-2 mb-1">
          <ImageIcon className="h-4 w-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Background Wallpaper</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Choose a stock wallpaper, pick a photo from the school gallery, or upload your own.
          The image sits softly behind the whole portal.
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <button onClick={() => setWallpaper('')}
            className={`relative aspect-video rounded-lg border-2 flex flex-col items-center justify-center text-gray-500 bg-gray-50 ${
              wallpaper === '' ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-400'
            }`}>
            <Ban className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">None</span>
          </button>

          {STOCK_WALLPAPERS.map(w => (
            <button key={w.id} onClick={() => setWallpaper(w.id)} title={w.label}
              className={`relative aspect-video rounded-lg border-2 overflow-hidden ${
                wallpaper === w.id ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-400'
              }`}>
              <img src={resolveWallpaperUrl(w.id)} alt={w.label} className="w-full h-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate">{w.label}</span>
            </button>
          ))}

          <button onClick={() => fileInput.current?.click()}
            className="relative aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-500 flex flex-col items-center justify-center text-gray-500">
            <Upload className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Upload</span>
          </button>
          <input ref={fileInput} type="file" accept="image/*" className="hidden"
            onChange={e => { uploadWallpaper(e.target.files?.[0]); e.target.value = ''; }} />
        </div>

        {galleryPhotos.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">From the Photo Gallery</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {galleryPhotos.slice(0, 12).map(p => (
                <button key={p.id} onClick={() => setWallpaper(p.imageUrl)} title={p.title}
                  className={`relative aspect-video rounded-lg border-2 overflow-hidden ${
                    wallpaper === p.imageUrl ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-400'
                  }`}>
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate">{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {wallpaper !== '' && (
          <div className="mt-4 max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fade into background — <strong>{dim}%</strong>
            </label>
            <input type="range" min={0} max={95} step={5} value={dim}
              onChange={e => updateTheme({ wallpaperDim: Number(e.target.value) })}
              className="w-full" />
            <p className="text-xs text-gray-500 mt-1">Higher = more subtle, keeps text easy to read.</p>
          </div>
        )}
      </div>

      {/* Theme preview */}
      <div className="rounded-xl border-2 p-5 space-y-3" style={{ borderColor: current.primary }}>
        <p className="text-sm font-semibold text-gray-700">Preview</p>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 text-white text-sm rounded-lg font-medium" style={{ backgroundColor: current.primary }}>
            Primary Button
          </button>
          <button className="px-4 py-2 text-sm rounded-lg font-medium border-2" style={{ color: current.primary, borderColor: current.primary }}>
            Outline Button
          </button>
          <span className="px-3 py-1 text-sm rounded-full text-white" style={{ backgroundColor: current.accent }}>
            Badge
          </span>
        </div>
        <div className="h-2 rounded-full" style={{ backgroundColor: current.primary, width: '60%' }} />
      </div>
    </div>
  );
}

export { applyTheme };
