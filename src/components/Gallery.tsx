import { useMemo, useRef, useState } from 'react';
import { Camera, Plus, Trash2, Pencil, X, Globe, Image as ImageIcon } from 'lucide-react';
import { useAppContext, GalleryPhoto } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { compressImage } from '../lib/images';
import { useToast } from './ToastProvider';

export const GALLERY_CATEGORIES = [
  'School Events', 'Sports Day', 'Classroom', 'Trips & Outings', 'Fundraisers', 'Graduation', 'Campus', 'Other',
];

interface PhotoForm {
  id?: string;
  title: string;
  category: string;
  date: string;
  imageUrl: string;
}

const EMPTY_FORM: PhotoForm = { title: '', category: GALLERY_CATEGORIES[0], date: new Date().toISOString().slice(0, 10), imageUrl: '' };

export function Gallery() {
  const { galleryPhotos, addGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto } = useAppContext();
  const { currentUser } = useAuth();
  const tc = useThemeClasses();
  const { toast } = useToast();
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState<PhotoForm | null>(null);
  const [viewing, setViewing] = useState<GalleryPhoto | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const canManage = currentUser?.role === 'Admin' || currentUser?.role === 'Teacher';

  const categories = useMemo(() => {
    const used = new Set(galleryPhotos.map(p => p.category));
    return ['All', ...GALLERY_CATEGORIES.filter(c => used.has(c)), ...[...used].filter(c => !GALLERY_CATEGORIES.includes(c))];
  }, [galleryPhotos]);

  const visible = filter === 'All' ? galleryPhotos : galleryPhotos.filter(p => p.category === filter);

  const pickPhoto = async (file: File | undefined) => {
    if (!file || !form) return;
    try {
      const dataUrl = await compressImage(file, 1280, 0.8);
      setForm({ ...form, imageUrl: dataUrl });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not read that image.', 'error');
    }
  };

  const saveForm = () => {
    if (!form) return;
    if (!form.title.trim()) { toast('Give the photo a title.', 'error'); return; }
    if (!form.imageUrl) { toast('Choose a photo to upload.', 'error'); return; }
    if (form.id) {
      updateGalleryPhoto(form.id, { title: form.title.trim(), category: form.category, date: form.date });
      toast('Photo updated.', 'success');
    } else {
      addGalleryPhoto({
        id: `photo-${Date.now()}`,
        title: form.title.trim(),
        category: form.category,
        date: form.date,
        imageUrl: form.imageUrl,
        addedBy: currentUser?.fullName,
      });
      toast('Photo added to the gallery.', 'success');
    }
    setForm(null);
  };

  const remove = (p: GalleryPhoto) => {
    if (!confirm(`Delete "${p.title}" from the gallery?`)) return;
    deleteGalleryPhoto(p.id);
    setViewing(null);
    toast('Photo deleted.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
          <p className="text-gray-600">Capture school life — events, sports, trips and everyday moments</p>
          <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" /> Photos added here also appear in the Gallery on the public school website.
          </p>
        </div>
        {canManage && (
          <button onClick={() => setForm({ ...EMPTY_FORM })}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-lg font-medium ${tc.btn}`}>
            <Plus className="h-4 w-4" /> Add Photo
          </button>
        )}
      </div>

      {/* Category filter */}
      {galleryPhotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filter === c ? `${tc.activeNav} border` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Camera className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No photos yet</p>
          <p className="text-sm text-gray-500 mt-1">
            {canManage
              ? 'Add photos of school events and they will show here and on the public website gallery.'
              : 'The school will publish photos of events here soon.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map(p => (
            <div key={p.id} className="group relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button onClick={() => setViewing(p)} className="block w-full">
                <img src={p.imageUrl} alt={p.title} className="w-full aspect-square object-cover" loading="lazy" />
              </button>
              <div className="p-3">
                <p className="font-semibold text-sm text-gray-900 truncate">{p.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.category} · {p.date}</p>
              </div>
              {canManage && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setForm({ id: p.id, title: p.title, category: p.category, date: p.date, imageUrl: p.imageUrl })}
                    className="p-1.5 bg-white/90 rounded-lg shadow hover:bg-white" title="Edit details">
                    <Pencil className="h-4 w-4 text-gray-700" />
                  </button>
                  <button onClick={() => remove(p)}
                    className="p-1.5 bg-white/90 rounded-lg shadow hover:bg-white" title="Delete photo">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {viewing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={viewing.imageUrl} alt={viewing.title} className="w-full max-h-[75vh] object-contain rounded-xl" />
            <div className="flex items-center justify-between mt-3 text-white">
              <div>
                <p className="font-semibold">{viewing.title}</p>
                <p className="text-sm text-white/70">{viewing.category} · {viewing.date}{viewing.addedBy ? ` · by ${viewing.addedBy}` : ''}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / edit modal */}
      {form && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{form.id ? 'Edit Photo' : 'Add Photo'}</h2>
              <button onClick={() => setForm(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              {!form.id && (
                <button onClick={() => fileInput.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-gray-500 rounded-xl p-4 flex flex-col items-center text-gray-500">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Selected" className="max-h-40 rounded-lg object-contain" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium">Click to choose a photo</span>
                      <span className="text-xs mt-0.5">It is compressed automatically for fast loading</span>
                    </>
                  )}
                </button>
              )}
              <input ref={fileInput} type="file" accept="image/*" className="hidden"
                onChange={e => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Sports Day 2026 — relay finals" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="flex space-x-3 pt-1">
                <button onClick={() => setForm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={saveForm}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${tc.btn}`}>
                  {form.id ? 'Save Changes' : 'Add to Gallery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
