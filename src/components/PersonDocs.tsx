import { useRef, useState } from 'react';
import { Camera, X, Upload, Download, Trash2, FolderOpen, FileText, Image as ImageIcon } from 'lucide-react';
import { useAppContext, PersonDocument, DocFolder } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { compressImage, fileToDataUrl } from '../lib/images';

const FOLDERS: DocFolder[] = ['Photos', 'Statements', 'Reports', 'Other'];

/** Circular avatar with upload/remove — used for students and teachers. */
export function PhotoUpload({ photoUrl, name, onChange, size = 20 }: {
  photoUrl?: string;
  name: string;
  onChange: (dataUrl: string | undefined) => void;
  size?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const px = `${size * 4}px`;

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0" style={{ width: px, height: px }}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full rounded-full object-cover border-2 border-gray-200" />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-400">{name.charAt(0) || '?'}</span>
          </div>
        )}
        <button type="button" onClick={() => input.current?.click()}
          className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow"
          title="Upload photo">
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="text-xs text-gray-500">
        <p>Profile photo</p>
        {photoUrl && (
          <button type="button" onClick={() => onChange(undefined)} className="text-red-500 hover:underline mt-0.5">
            Remove photo
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden"
        onChange={async e => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            onChange(await compressImage(f, 300, 0.82));
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Could not read the image.', 'error');
          }
        }} />
    </div>
  );
}

/** Folder-based document manager for a student, teacher or family. */
export function PersonDocuments({ ownerType, ownerId, title }: {
  ownerType: PersonDocument['ownerType'];
  ownerId: string;
  title?: string;
}) {
  const { documents, addDocument, deleteDocument } = useAppContext();
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState<DocFolder>('Photos');

  const mine = documents.filter(d => d.ownerType === ownerType && d.ownerId === ownerId);
  const inFolder = mine.filter(d => d.folder === folder);

  const download = (d: PersonDocument) => {
    const a = document.createElement('a');
    a.href = d.dataUrl; a.download = d.name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-semibold text-gray-700">{title ?? 'Documents'}</p>
          <span className="text-xs text-gray-400">{mine.length} file{mine.length !== 1 ? 's' : ''}</span>
        </div>
        <button onClick={() => input.current?.click()}
          className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2.5 py-1.5 font-medium">
          <Upload className="h-3 w-3" />Upload to {folder}
        </button>
      </div>

      <div className="flex border-b border-gray-100">
        {FOLDERS.map(f => {
          const count = mine.filter(d => d.folder === f).length;
          return (
            <button key={f} onClick={() => setFolder(f)}
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                folder === f ? 'bg-white text-blue-700 border-b-2 border-blue-600' : 'bg-gray-50/50 text-gray-500 hover:text-gray-700'
              }`}>
              {f}{count > 0 && <span className="ml-1 text-gray-400">({count})</span>}
            </button>
          );
        })}
      </div>

      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {inFolder.length === 0 ? (
          <p className="p-5 text-xs text-gray-400 text-center">No files in {folder} yet — use Upload above.</p>
        ) : inFolder.map(d => (
          <div key={d.id} className="px-4 py-2.5 flex items-center gap-3">
            {d.mimeType.startsWith('image/') ? (
              <img src={d.dataUrl} alt="" className="w-9 h-9 rounded object-cover border border-gray-200 flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{d.name}</p>
              <p className="text-xs text-gray-400">{Math.round(d.size / 1024)}KB &bull; {new Date(d.uploadedAt).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <button onClick={() => download(d)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Download">
              <Download className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { deleteDocument(d.id); toast('File deleted.', 'info'); }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <input ref={input} type="file" className="hidden"
        onChange={async e => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            const dataUrl = f.type.startsWith('image/')
              ? await compressImage(f, 1200, 0.8)
              : await fileToDataUrl(f);
            addDocument({
              id: `doc-${Date.now()}`,
              ownerType, ownerId, folder,
              name: f.name,
              mimeType: f.type || 'application/octet-stream',
              size: dataUrl.length,
              dataUrl,
              uploadedAt: new Date().toISOString(),
            });
            toast(`${f.name} saved to ${folder}.`, 'success');
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Upload failed.', 'error');
          }
        }} />
    </div>
  );
}
