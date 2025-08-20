// frontend/src/pages/DatasetManager.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Upload,
  Database,
  BarChart3,
  Download,
  Trash2,
  Eye,
  Settings,
  Plus,
  Search,
  Filter,
  Check,
  X,
  Loader2,
  FileText,
  Grid,
  List,
} from "lucide-react";
import { CSVLink } from "react-csv";
import toast from "react-hot-toast";
import { DataTable } from "../components/Tables/DataTable";
import { MetricCard } from "../components/Cards/MetricCard";
import { datasetsAPI } from "../services/api"; // implemented above
import { useAppStore } from "../stores/useAppStore"; // adjust path if needed

// --- Types
interface Dataset {
  id: string;
  name: string;
  description?: string;
  size_mb: number;
  size_bytes?: number;
  samples: number;
  features: number;
  quality_score: number; // 0-100
  fl_suitability: number; // 0-100
  privacy_level: "public" | "private" | "restricted" | string;
  upload_date: string;
  status: "ready" | "processing" | "failed" | "archived" | string;
  owner?: string;
  tags?: string[];
  preview_rows?: Array<Record<string, any>>;
}

const PAGE_SIZE = 10;

const _formatBytes = (bytes: number) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let u = -1;
  do {
    bytes = bytes / 1024;
    u++;
  } while (bytes >= 1024 && u < units.length - 1);
  return `${bytes.toFixed(1)} ${units[u]}`;
};

// upload metadata modal component
const UploadMetadataModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File, metadata: { name?: string; description?: string; tags?: string[] }) => void;
}> = ({ open, onClose, onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setFile(null);
      setName("");
      setDescription("");
      setTags("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl p-6 shadow-lg z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Upload dataset</h3>
          <button onClick={onClose} className="p-1"><X className="w-4 h-4" /></button>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <label className="block">
            <div className="text-xs text-gray-600">File</div>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && <div className="mt-1 text-xs text-gray-500">{file.name} • {_formatBytes(file.size)}</div>}
          </label>

          <label>
            <div className="text-xs text-gray-600">Name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Descriptive dataset name" className="w-full px-3 py-2 border rounded" />
          </label>

          <label>
            <div className="text-xs text-gray-600">Description</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Short summary of dataset content" />
          </label>

          <label>
            <div className="text-xs text-gray-600">Tags (comma-separated)</div>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. network,ids,botnet" className="w-full px-3 py-2 border rounded" />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
          <button
            onClick={() => {
              if (!file) return toast.error("Select a file first");
              onSubmit(file, { name: name || file.name, description, tags: tags.split(",").map(t => t.trim()).filter(Boolean) });
            }}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Upload
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const DatasetManager: React.FC = () => {
  const qc = useQueryClient();
  const { user } = useAppStore(); // expects { username, role }
  const role = user?.role ?? "user";

  // ui state
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // reset input after upload
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  // --- Fetch datasets (server-side)
  const { data: dsResp, isLoading, isError, refetch } = useQuery(
    ["datasets", { page, q: query, tag: tagFilter, status: statusFilter, sort_field: sortField, sort_order: sortOrder }],
    () => datasetsAPI.list({ page, page_size: PAGE_SIZE, q: query, tag: tagFilter, status: statusFilter, sort_field: sortField, sort_order: sortOrder }),
    { keepPreviousData: true, staleTime: 5_000, onError: () => toast.error("Failed to load datasets") }
  );

  const total = dsResp?.total || 0;
  const items: Dataset[] = dsResp?.items || [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // --- Mutations
  const deleteMutation = useMutation((id: string) => datasetsAPI.delete(id), {
    onMutate: async (id: string) => {
      await qc.cancelQueries(["datasets"]);
      const prev = qc.getQueryData(["datasets", { page, q: query, tag: tagFilter, status: statusFilter, sort_field: sortField, sort_order: sortOrder }]);
      qc.setQueryData(["datasets", { page, q: query, tag: tagFilter, status: statusFilter, sort_field: sortField, sort_order: sortOrder }], (old: any) => {
        if (!old) return old;
        return { ...old, items: old.items.filter((d: Dataset) => d.id !== id) };
      });
      return { prev };
    },
    onError: (_err, _id, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["datasets", { page, q: query, tag: tagFilter, status: statusFilter, sort_field: sortField, sort_order: sortOrder }], ctx.prev);
      toast.error("Failed to delete dataset");
    },
    onSuccess: () => {
      toast.success("Dataset deleted");
      qc.invalidateQueries(["datasets"]);
    }
  });

  const uploadMutation = useMutation(
    ({ file, metadata }: { file: File; metadata?: any }) =>
      datasetsAPI.upload(file, metadata, (pct: number) => setUploadProgress(pct)),
    {
      onMutate: () => {
        setUploading(true);
        setUploadProgress(0);
      },
      onError: () => {
        setUploading(false);
        setUploadProgress(null);
        toast.error("Upload failed");
      },
      onSuccess: () => {
        setUploading(false);
        setUploadProgress(null);
        setFileInputKey(Date.now());
        setUploadModalOpen(false);
        toast.success("Upload successful");
        qc.invalidateQueries(["datasets"]);
      },
    }
  );

  // preview
  const onPreview = async (dataset: Dataset) => {
    setSelectedDataset(null);
    try {
      const data = await datasetsAPI.preview(dataset.id);
      setSelectedDataset({ ...dataset, preview_rows: data.rows });
    } catch (e) {
      toast.error("Failed to load preview");
    }
  };

  // delete (role guarded)
  const onDelete = (id: string) => {
    if (role !== "admin") {
      toast.error("Insufficient permissions");
      return;
    }
    if (!confirm("Delete dataset? This action is irreversible.")) return;
    deleteMutation.mutate(id);
  };

  // upload modal submit
  const onUploadSubmit = (file: File, metadata: any) => {
    uploadMutation.mutate({ file, metadata });
  };

  // CSV export
  const csvData = useMemo(() => items.map(d => ({
    id: d.id,
    name: d.name,
    samples: d.samples,
    features: d.features,
    size_mb: d.size_mb,
    quality_score: d.quality_score,
    fl_suitability: d.fl_suitability,
    privacy_level: d.privacy_level,
    upload_date: d.upload_date,
    status: d.status,
    owner: d.owner || ""
  })), [items]);

  // derived metrics
  const metrics = useMemo(() => {
    const avgQuality = items.length ? Math.round(items.reduce((s, it) => s + (it.quality_score || 0), 0) / items.length) : 0;
    const avgSuit = items.length ? Math.round(items.reduce((s, it) => s + (it.fl_suitability || 0), 0) / items.length) : 0;
    const totalSamples = items.reduce((s, it) => s + (it.samples || 0), 0);
    const totalSizeMB = items.reduce((s, it) => s + (it.size_mb || 0), 0);
    return { avgQuality, avgSuit, totalSamples, totalSizeMB };
  }, [items]);

  // tags from current page
  const tags = useMemo(() => {
    const s = new Set<string>();
    items.forEach(i => (i.tags || []).forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [items]);

  // Table columns with server-side sort support: clicking header updates sort state
  const tableColumns = [
    { key: "name", label: "Name", sortable: true },
    { key: "samples", label: "Samples", sortable: true, render: (v: number) => v?.toLocaleString() ?? "—" },
    { key: "features", label: "Features", sortable: true },
    { key: "quality_score", label: "Quality", sortable: true, render: (v: number) => `${v ?? 0}%` },
    { key: "fl_suitability", label: "FL Suitability", sortable: true, render: (v: number) => `${v ?? 0}%` },
    { key: "size_mb", label: "Size", sortable: true, render: (v: number, row: Dataset) => `${v ?? row.size_mb ?? 0} MB` },
    { key: "privacy_level", label: "Privacy", sortable: true },
    { key: "upload_date", label: "Uploaded", sortable: true, render: (v: string) => new Date(v).toLocaleString() },
    { key: "status", label: "Status", sortable: true, render: (v: string) => (<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === "ready" ? "bg-green-100 text-green-800" : v === "processing" ? "bg-yellow-100 text-yellow-800" : v === "failed" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>{v}</span>) },
    {
      key: "actions", label: "", render: (_: any, row: Dataset) => (
        <div className="flex items-center gap-2">
          <button title="Preview" onClick={() => onPreview(row)} className="p-2 rounded hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
          <button title="Download" onClick={() => datasetsAPI.download(row.id)} className="p-2 rounded hover:bg-gray-100"><Download className="w-4 h-4" /></button>
          {role === "admin" && <button title="Delete" onClick={() => onDelete(row.id)} className="p-2 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>}
        </div>
      )
    }
  ];

  // helper for sorting header clicks
  const onHeaderSort = (field: string) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder("asc");
    } else {
      setSortOrder(prev => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"));
      if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
      }
    }
    setPage(1);
  };

  const prevPage = () => setPage(p => Math.max(1, p - 1));
  const nextPage = () => setPage(p => Math.min(totalPages, p + 1));
  const goToPage = (n: number) => setPage(Math.max(1, Math.min(totalPages, n)));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Datasets</h1>
          <p className="text-sm text-gray-500">Manage datasets used by the FL engine — upload, preview, export and monitor quality & privacy.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input placeholder="Search datasets..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="bg-transparent outline-none text-sm w-56" />
            {query && <button onClick={() => setQuery("")} className="p-1"><X className="w-4 h-4" /></button>}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode("table")} title="Table" className={`p-2 rounded ${viewMode === "table" ? "bg-gray-100" : ""}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("grid")} title="Grid" className={`p-2 rounded ${viewMode === "grid" ? "bg-gray-100" : ""}`}><Grid className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setUploadModalOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md">
              <Upload className="w-4 h-4" /> Upload
            </button>

            <CSVLink data={csvData} filename={`datasets-export-${new Date().toISOString()}.csv`} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-md border">
              <Download className="w-4 h-4" /> Export
            </CSVLink>
          </div>
        </div>
      </motion.div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Datasets" value={String(total)} icon={Database} color="blue" />
        <MetricCard title="Avg. Quality" value={`${metrics.avgQuality}%`} icon={BarChart3} color="green" />
        <MetricCard title="Avg. FL Suitability" value={`${metrics.avgSuit}%`} icon={Zap} color="purple" />
        <MetricCard title="Total Samples" value={metrics.totalSamples.toLocaleString()} icon={FileText} color="indigo" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select className="px-3 py-1 rounded border bg-white" value={tagFilter ?? ""} onChange={(e) => { setTagFilter(e.target.value || null); setPage(1); }}>
            <option value="">All tags</option>
            {tags.map(t => <option value={t} key={t}>{t}</option>)}
          </select>

          <select className="px-3 py-1 rounded border bg-white" value={statusFilter ?? ""} onChange={(e) => { setStatusFilter(e.target.value || null); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
      </div>

      {/* Content area */}
      <div>
        {isLoading ? (
          <div className="py-12 flex justify-center items-center"><Loader2 className="animate-spin" /></div>
        ) : isError ? (
          <div className="py-8 text-center text-red-600">Error loading datasets</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No datasets found. Upload your first dataset to get started.</div>
        ) : viewMode === "table" ? (
          <div className="overflow-auto">
            {/* Simple table with server-side header sorting */}
            <table className="w-full text-sm table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  {tableColumns.slice(0, -1).map((col: any) => (
                    <th key={col.key} className="px-3 py-2 border-b">
                      <div className="flex items-center gap-2">
                        <button onClick={() => col.sortable && onHeaderSort(col.key)} className="font-medium">
                          {col.label}
                        </button>
                        {sortField === col.key && <span className="text-xs text-gray-500">{sortOrder === "asc" ? "▲" : sortOrder === "desc" ? "▼" : ""}</span>}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border-b">{row.name}<div className="text-xs text-gray-400">{row.owner}</div></td>
                    <td className="px-3 py-2 border-b">{row.samples?.toLocaleString()}</td>
                    <td className="px-3 py-2 border-b">{row.features}</td>
                    <td className="px-3 py-2 border-b">{row.quality_score}%</td>
                    <td className="px-3 py-2 border-b">{row.fl_suitability}%</td>
                    <td className="px-3 py-2 border-b">{row.size_mb} MB</td>
                    <td className="px-3 py-2 border-b">{row.privacy_level}</td>
                    <td className="px-3 py-2 border-b">{new Date(row.upload_date).toLocaleString()}</td>
                    <td className="px-3 py-2 border-b"><span className={`px-2 py-0.5 rounded-full text-xs ${row.status==="ready"?"bg-green-100 text-green-800":"bg-gray-100 text-gray-800"}`}>{row.status}</span></td>
                    <td className="px-3 py-2 border-b">
                      <div className="flex gap-2">
                        <button onClick={() => onPreview(row)} title="Preview" className="p-2 rounded hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => datasetsAPI.download(row.id)} title="Download" className="p-2 rounded hover:bg-gray-100"><Download className="w-4 h-4" /></button>
                        {role === "admin" && <button onClick={() => onDelete(row.id)} title="Delete" className="p-2 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(ds => (
              <motion.div key={ds.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 dark:bg-gray-800/60 p-4 rounded-xl border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-md">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{ds.name}</h3>
                        <span className="text-xs text-gray-500">by {ds.owner || "unknown"}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ds.description || "No description"}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600">{(ds.size_bytes ? _formatBytes(ds.size_bytes) : `${ds.size_mb ?? 0} MB`)}</div>
                    <div className="text-xs text-gray-400">{new Date(ds.upload_date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${ds.status === "ready" ? "bg-green-100 text-green-800" : ds.status === "processing" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>{ds.status}</div>
                    <div className="text-xs text-gray-500">Quality: {ds.quality_score}%</div>
                    <div className="text-xs text-gray-500">FL: {ds.fl_suitability}%</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => onPreview(ds)} title="Preview" className="p-2 rounded hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => datasetsAPI.download(ds.id)} title="Download" className="p-2 rounded hover:bg-gray-100"><Download className="w-4 h-4" /></button>
                    {role === "admin" && <button onClick={() => onDelete(ds.id)} title="Delete" className="p-2 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>

                {ds.preview_rows && ds.preview_rows.length > 0 && (
                  <div className="mt-3 bg-gray-50 rounded p-2 text-xs overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500">Preview</div>
                      <div className="text-xs text-gray-400">{ds.preview_rows.length} rows</div>
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr>{Object.keys(ds.preview_rows[0]).slice(0, 6).map(col => <th key={col} className="pr-2">{col}</th>)}</tr>
                      </thead>
                      <tbody>
                        {ds.preview_rows.slice(0, 3).map((r, i) => (
                          <tr key={i}>{Object.values(r).slice(0, 6).map((c, j) => <td key={j} className="pr-2">{String(c)}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination & upload progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => prevPage()} disabled={page <= 1} className="px-3 py-1 rounded border">Prev</button>
          <input value={String(page)} onChange={(e) => goToPage(Number(e.target.value || 1))} className="w-12 text-center px-2 py-1 border rounded" />
          <button onClick={() => nextPage()} disabled={page >= totalPages} className="px-3 py-1 rounded border">Next</button>
          <div className="text-sm text-gray-500 ml-3">Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, total)} of {total}</div>
        </div>

        <div className="flex items-center gap-4">
          {uploading && (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin w-4 h-4" />
              <div className="text-sm">Uploading{uploadProgress !== null ? ` ${Math.round(uploadProgress)}%` : ""}</div>
            </div>
          )}

          <div>
            <button onClick={() => { setQuery(""); setPage(1); setTagFilter(null); setStatusFilter(null); }} className="px-3 py-1 rounded border">Reset filters</button>
          </div>
        </div>
      </div>

      {/* Selected dataset modal */}
      {selectedDataset && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedDataset(null)} />
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl p-6 shadow-lg z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedDataset.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedDataset.description}</p>
                <div className="mt-3 flex gap-3 text-xs text-gray-600">
                  <div>Owner: {selectedDataset.owner || "unknown"}</div>
                  <div>Samples: {selectedDataset.samples?.toLocaleString()}</div>
                  <div>Features: {selectedDataset.features}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { datasetsAPI.download(selectedDataset.id); }} className="px-3 py-1 rounded border inline-flex items-center gap-2"><Download className="w-4 h-4" />Download</button>
                <button onClick={() => { setSelectedDataset(null); }} className="px-3 py-1 rounded border">Close</button>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Preview (first rows)</h4>
              <div className="max-h-72 overflow-auto bg-gray-50 rounded p-2">
                {selectedDataset.preview_rows && selectedDataset.preview_rows.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead><tr>{Object.keys(selectedDataset.preview_rows[0]).map(col => <th key={col} className="text-left pr-4">{col}</th>)}</tr></thead>
                    <tbody>
                      {selectedDataset.preview_rows.slice(0, 50).map((r, i) => (
                        <tr key={i}>{Object.values(r).map((v, j) => <td key={j} className="pr-4">{String(v)}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-gray-500">No preview available</div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Upload modal */}
      <UploadMetadataModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onSubmit={onUploadSubmit} />
    </div>
  );
};

export default DatasetManager;
