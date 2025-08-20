// frontend/src/pages/FLAlgorithms.tsx
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Brain, Activity, Gauge, Filter } from "lucide-react";
import toast from "react-hot-toast";

import { researchAPI } from "../services/api";

// -------------------
// Types
// -------------------
type Algorithm = {
  name: string;
  description?: string;
  implementation_status?: "production" | "testing" | "experimental" | string;
  performance_metrics?: {
    accuracy?: number;
    convergence_rate?: number;
    communication_efficiency?: number;
    robustness?: number;
  };
};

// -------------------
// Helpers
// -------------------
const formatPct = (v?: number) =>
  v === undefined || v === null ? "-" : `${(v * 100).toFixed(1)}%`;

const exportToCSV = (rows: Algorithm[], filename = "fl_algorithms.csv") => {
  if (!rows?.length) {
    toast("No algorithms to export");
    return;
  }
  const headers = [
    "name",
    "description",
    "implementation_status",
    "accuracy",
    "convergence_rate",
    "communication_efficiency",
    "robustness",
  ];
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          let val: any =
            h in (r.performance_metrics || {})
              ? (r.performance_metrics as any)[h]
              : (r as any)[h];
          if (val === undefined || val === null) return '""';
          const s = String(val).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported CSV");
};

// -------------------
// Component
// -------------------
const FLAlgorithms: React.FC = () => {
  const { data: algorithmsResp, isLoading } = useQuery(
    ["research-algorithms"],
    () => researchAPI.getEnterpriseAlgorithms(),
    { retry: 1 }
  );

  const algorithms: Algorithm[] =
    algorithmsResp?.data?.algorithms ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("accuracy");
  const [selectedAlg, setSelectedAlg] = useState<Algorithm | null>(null);

  const filtered = useMemo(() => {
    let list = algorithms;
    if (search) {
      list = list.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      list = list.filter(
        (a) =>
          (a.implementation_status ?? "other").toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = a.performance_metrics?.[sortKey as keyof Algorithm] ?? 0;
        const bv = b.performance_metrics?.[sortKey as keyof Algorithm] ?? 0;
        return Number(bv) - Number(av);
      });
    }
    return list;
  }, [algorithms, search, statusFilter, sortKey]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
            Federated Learning Algorithms
          </h1>
          <p className="text-gray-500 text-sm">
            Explore and evaluate available FL algorithms with performance metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search algorithms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="production">Production</option>
            <option value="testing">Testing</option>
            <option value="experimental">Experimental</option>
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="accuracy">Sort by Accuracy</option>
            <option value="convergence_rate">Sort by Convergence</option>
            <option value="communication_efficiency">
              Sort by Efficiency
            </option>
            <option value="robustness">Sort by Robustness</option>
          </select>
          <button
            onClick={() => exportToCSV(filtered)}
            className="px-4 py-2 rounded-lg border flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Grid of algorithms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && <p>Loading algorithms...</p>}
        {!isLoading &&
          filtered.map((alg) => (
            <motion.div
              key={alg.name}
              whileHover={{ scale: 1.02 }}
              className="p-5 rounded-xl border bg-white shadow-sm hover:shadow-md cursor-pointer"
              onClick={() => setSelectedAlg(alg)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{alg.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    alg.implementation_status === "production"
                      ? "bg-green-100 text-green-700"
                      : alg.implementation_status === "testing"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {alg.implementation_status ?? "N/A"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {alg.description || "No description"}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded">
                  Accuracy: {formatPct(alg.performance_metrics?.accuracy)}
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  Conv.: {formatPct(alg.performance_metrics?.convergence_rate)}
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  Efficiency:{" "}
                  {formatPct(alg.performance_metrics?.communication_efficiency)}
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  Robustness: {formatPct(alg.performance_metrics?.robustness)}
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedAlg && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedAlg.name}</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedAlg(null)}
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                {selectedAlg.description ?? "No description available"}
              </p>
              <div className="space-y-2 text-sm">
                <div>Status: {selectedAlg.implementation_status}</div>
                <div>
                  Accuracy: {formatPct(selectedAlg.performance_metrics?.accuracy)}
                </div>
                <div>
                  Convergence:{" "}
                  {formatPct(selectedAlg.performance_metrics?.convergence_rate)}
                </div>
                <div>
                  Efficiency:{" "}
                  {formatPct(
                    selectedAlg.performance_metrics?.communication_efficiency
                  )}
                </div>
                <div>
                  Robustness:{" "}
                  {formatPct(selectedAlg.performance_metrics?.robustness)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FLAlgorithms;
