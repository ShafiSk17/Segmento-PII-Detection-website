"use client";
import { useState } from "react";
import axios from "axios";
import { UploadCloud, ShieldCheck, Activity, FileText, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// ⚠️ IMPORTANT: Replace this with your Hugging Face Space URL later
const API_URL = "https://workwithshafisk-segmento-sense.hf.space"; 

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_URL}/scan/file`, formData);
      setData(res.data);
    } catch (err) {
      alert("Scan failed! Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-bold tracking-tight">Segmento Sense</span>
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition">
          Enterprise Login
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
            Secure Your Data Infrastructure
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            AI-powered PII detection for the modern stack. trusted by security teams to detect sensitive data in files, databases, and cloud storage.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-10 max-w-2xl mx-auto mb-12">
          <div className="border-2 border-dashed border-indigo-100 rounded-xl p-8 text-center hover:bg-indigo-50/50 transition cursor-pointer relative">
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                {file ? file.name : "Click to upload or drag and drop"}
              </h3>
              <p className="text-sm text-slate-500 mt-2">PDF, CSV, JSON, Parquet (Max 50MB)</p>
            </div>
          </div>
          
          <button
            onClick={handleScan}
            disabled={!file || loading}
            className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Activity className="animate-spin" /> : "Start Deep Scan"}
          </button>
        </div>

        {/* Results Dashboard */}
        {data && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* PII Distribution Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <FileText className="text-indigo-500" /> PII Breakdown
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.counts}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="Count"
                      nameKey="PII Type"
                    >
                      {data.counts.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inspector Table */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" /> Model Inspector
              </h3>
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Detector</th>
                      <th className="px-4 py-3">Accuracy</th>
                      <th className="px-4 py-3">Missed PII</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.inspection.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.Model}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            row.Accuracy > 0.8 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {(row.Accuracy * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-red-500 text-xs truncate max-w-[120px]" title={row["Missed PII"]}>
                          {row["Missed PII"]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
