import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Video,
  Music,
  Archive,
  Clock3,
  ChevronDown,
  Download,
  Trash2,
  FileText as FileTextIcon,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import { getLibraryItems, uploadLibraryItems, deleteLibraryItem, LibraryItem } from '@/api/library';
import { toast } from 'react-hot-toast';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'images', label: 'Images' },
  { id: 'videos', label: 'Videos' },
  { id: 'audio', label: 'Audio' },
  { id: 'files', label: 'Files' },
];

const categoryIcons: Record<string, React.ReactNode> = {
  images: <ImageIcon size={20} className="text-slate-300" />,
  videos: <Video size={20} className="text-slate-300" />,
  audio: <Music size={20} className="text-slate-300" />,
  files: <FileTextIcon size={20} className="text-slate-300" />,
};

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Unknown';
  }
}

export default function LibraryPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rawBackend = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  const backendOrigin = rawBackend.replace(/\/api\/?$/i, '');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await getLibraryItems();
      setItems(response);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load library items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => activeCategory === 'all' || item.category === activeCategory)
      .filter((item) => item.original_name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (!sortNewest) return 0;
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      });
  }, [items, activeCategory, search, sortNewest]);

  const handleUploadSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      await uploadLibraryItems(Array.from(files));
      toast.success('Files uploaded to Library');
      await fetchItems();
    } catch (error: any) {
      toast.error(error?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this item from your Library?')) return;
    try {
      await deleteLibraryItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Item deleted');
    } catch (error: any) {
      toast.error(error?.message || 'Could not delete item');
    }
  };

  const downloadUrl = (url: string) => {
    return url.startsWith('http') ? url : `${backendOrigin}${url}`;
  };

  return (
    <div className="min-h-screen bg-[#09090f] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex h-full w-full max-w-[1280px] flex-col">
        {/* Header / Controls */}
        <div className="mb-6 rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3 text-slate-200">
                <Archive size={20} className="text-cyan-400" />
                <h1 className="text-3xl font-semibold tracking-tight text-white">Library</h1>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Browse saved resources, images, audio, files, and voice-ready assets from your workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-slate-200 shadow-inner shadow-black/10">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Items</span>
                <span className="text-sm font-semibold text-white">{items.length}</span>
              </div>
              <button
                type="button"
                onClick={handleUploadSelect}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} /> {uploading ? 'Uploading...' : 'Upload files'}
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Library..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/90 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setSortNewest((current) => !current)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-purple-500 hover:text-white"
              >
                {sortNewest ? 'Newest first' : 'Oldest first'}
                <ChevronDown size={16} />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    activeCategory === category.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleFilesSelected}
        />

        {/* Main content – full height, scrollable */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto pr-1">
            <div className="space-y-4">
              <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-black/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Files</p>
                    <h2 className="mt-2 text-lg font-semibold text-white">{filteredItems.length} items found</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-300">
                    <Clock3 size={14} /> Updated recently
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-8 text-center text-slate-400">
                  Loading Library items...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-white/10 bg-slate-950/70 p-10 text-center text-slate-400">
                  No files found. Upload files to your Library to see them here.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="group overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 shadow-lg shadow-black/20 transition hover:border-purple-500/50"
                    >
                      <div className="h-52 overflow-hidden bg-slate-900/80 text-slate-300">
                        {item.category === 'images' ? (
                          <img
                            src={downloadUrl(item.url)}
                            alt={item.original_name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : item.category === 'videos' ? (
                          <video
                            src={downloadUrl(item.url)}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            loop
                          />
                        ) : (
                          <div className="flex h-52 items-center justify-center">
                            {categoryIcons[item.category] ?? <File size={20} className="text-slate-300" />}
                          </div>
                        )}
                      </div>
                      <div className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-white">{item.original_name}</h3>
                            <p className="mt-2 text-sm text-slate-400">
                              {item.category.charAt(0).toUpperCase() + item.category.slice(1)} ·{' '}
                              {formatBytes(item.size)} · {formatDate(item.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <a
                            href={downloadUrl(item.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                          >
                            <Download size={14} /> Download
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-red-600/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-600/20"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}