"use client";

import React, { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import styles from "./dashboard.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeSwitcher from "../components/ThemeSwitcher";
import UserMenu from "../components/UserMenu";
import Logo from "../components/Logo";
import SplashLoader from "../components/SplashLoader";
import { AlertTriangle, FileText, Lightbulb, BarChart, Bot, Sparkles, MessageSquare, Zap, XCircle, Calendar, ChevronLeft, Plus } from "lucide-react";

// ── Validation Helpers ──
const V = {
  email(v: string) {
    if (!v) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : "Enter a valid email address";
  },
  cron(v: string) {
    if (!v || !v.trim()) return "Cron expression is required";
    const parts = v.trim().split(/\s+/);
    if (parts.length !== 5) return "Cron must have 5 fields";
    const valid = parts.every((p) => /^(\*|[0-9,\-\/]+)$/.test(p));
    if (!valid) return "Invalid cron expression";
    return null;
  },
};

const timeAgo = (iso: string) => {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [wsConnected, setWsConnected] = useState(false);
  const [newEventCount, setNewEventCount] = useState(0);

  const [showSplash, setShowSplash] = useState(true);
  const [initData, setInitData] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [feedItems, setFeedItems] = useState<any[]>([]);

  const [insights, setInsights] = useState<any[]>([]);
  const [insightSummary, setInsightSummary] = useState("");
  const [insightError, setInsightError] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);

  const [reports, setReports] = useState<any[]>([]);
  const [previewReportId, setPreviewReportId] = useState<number | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [schedules, setSchedules] = useState<any[]>([]);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [schedLoading, setSchedLoading] = useState(false);
  const [newSched, setNewSched] = useState({ cron: "0 9 * * 1", email: "" });
  const [schedErrors, setSchedErrors] = useState({ cron: "", email: "" });

  const [toasts, setToasts] = useState<any[]>([]);
  const toastCtr = useRef(0);

  const [acct, setAcct] = useState<any>({ name: "", avatar: "", avatarDataUri: "", avatarStyle: "lorelei", avatarRollSeed: 0 });
  const [acctSaving, setAcctSaving] = useState(false);
  const [acctMsg, setAcctMsg] = useState("");
  const [acctMsgOk, setAcctMsgOk] = useState(true);
  const [avatarGenerating, setAvatarGenerating] = useState(false);
  const [avatarStyles, setAvatarStyles] = useState<any[]>([]);

  const [cleanedDatasets, setCleanedDatasets] = useState<any[]>([]);
  const [edaReports, setEdaReports] = useState<any[]>([]);
  const [acctDatasetsLoading, setAcctDatasetsLoading] = useState(false);
  const [acctEdaLoading, setAcctEdaLoading] = useState(false);

  const [assets, setAssets] = useState<any>({ datasets: [], models: [], reports: [] });
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsRenaming, setAssetsRenaming] = useState<any>({});
  
  const startRename = (type: string, item: any) => {
    // This is a placeholder since we are not fully implementing renaming right now
    setAssetsRenaming((prev: any) => ({ ...prev, [item.id || item.upload_id]: true }));
  };
  
  const commitRename = (type: string, item: any) => {
    // Placeholder
    setAssetsRenaming((prev: any) => ({ ...prev, [item.id || item.upload_id]: false }));
  };

  const rerollAvatar = () => {};
  const generateAvatar = () => {};
  const selectStyle = (id: string) => {};
  const saveAccount = () => {};
  const [assetsEditName, setAssetsEditName] = useState<any>({});
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const feedScrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // ── apiFetch ──
  const apiFetch = async (url: string, opts: any = {}) => {
    opts.headers = { Accept: "application/json", ...(opts.headers || {}) };
    try {
      const res = await fetch(`/api${url.startsWith("/api") ? url.slice(4) : url}`, opts);
      if (res.status === 401) {
        window.location.href = "/login";
        return { ok: false, status: 401, data: null, error: "Not authenticated" };
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        return { ok: false, status: res.status, data: null, error: `Server returned non-JSON (${res.status})` };
      }
      const data = await res.json();
      return { ok: res.ok, status: res.status, data, error: data.error || null };
    } catch (e: any) {
      return { ok: false, status: 0, data: null, error: "Network error: " + e.message };
    }
  };

  const pushToast = (t: any) => {
    toastCtr.current++;
    const id = toastCtr.current;
    setToasts((prev) => [...prev, { ...t, id, leaving: false }]);
    setTimeout(() => dismissToast(id), 5500);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 280);
  };

  const resumeProject = async (uploadId: number, hashHash: string = "") => {
    setRestoringId(uploadId);
    try {
      const { ok, data, error } = await apiFetch(`/restore/${uploadId}`, { method: "POST" });
      if (!ok || data?.error) {
        pushToast({ type: "alert", icon: <AlertTriangle size={16} className="text-red-500" />, title: "Restore Failed", body: error || data?.error || "Unknown error" });
        return;
      }

      sessionStorage.setItem('restore_state', JSON.stringify({
        clean_meta: data.clean_meta || null,
        automl_meta: data.automl_meta || null,
        has_eda: data.has_eda || false,
        chat_history: data.chat_history || [],
      }));

      router.push(`/workspace?upload_id=${encodeURIComponent(uploadId)}${hashHash}`);
    } catch (e: any) {
      pushToast({ type: "alert", icon: <AlertTriangle size={16} className="text-red-500" />, title: "Network Error", body: e.message });
    } finally {
      setRestoringId(null);
    }
  };

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      const { ok, data, error } = await apiFetch("/dashboard/init");
      if (!ok) {
        setError(error || "Failed to load dashboard");
        setLoading(false);
        return;
      }
      setInitData(data);
      setStats(data.stats || {});
      setReports(data.recent_reports || []);
      setPreviewReportId(data.recent_reports?.[0]?.id || null);

      const _feed = (data.recent_analyses || []).map((an: any, i: number) => ({
        id: `seed-${i}`,
        type: an.type,
        label: an.label,
        icon: an.icon,
        summary: an.summary,
        filename: an.filename,
        time_ago: an.time_ago,
        isNew: false,
      }));
      setFeedItems(_feed);

      setAcct({
        name: data.user.name || "",
        avatar: data.user.avatar || "",
        avatarDataUri: data.user.avatar || "",
        avatarStyle: "lorelei",
        avatarRollSeed: 0
      });

      setLoading(false);

      // Sub-fetches
      loadReports();
      loadSchedules();

      // WS - Use native WebSocket instead of socket.io-client to align with FastAPI backend
      let ws: WebSocket | null = null;
      let pingInterval: any = null;
      let reconnectTimeout: any = null;
      const eventHandlers: { [key: string]: ((data: any) => void)[] } = {};

      const connectWs = () => {
        // WebSocket connects directly to the backend (Next.js can't proxy WS upgrades).
        // In production, NEXT_PUBLIC_API_URL is e.g. https://api.yourdomain.com
        // In local dev it defaults to http://localhost:5000
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
        const wsUrl = apiUrl.replace(/^http/, "ws") + "/ws";
        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          setWsConnected(true);
          eventHandlers["connect"]?.forEach(cb => cb(null));
        };
        
        ws.onclose = () => {
          setWsConnected(false);
          eventHandlers["disconnect"]?.forEach(cb => cb(null));
          // Reconnect with backoff
          reconnectTimeout = setTimeout(connectWs, 5000);
        };
        
        ws.onerror = () => {
          setWsConnected(false);
          eventHandlers["connect_error"]?.forEach(cb => cb(null));
        };
        
        ws.onmessage = (event) => {
          try {
            if (event.data === "pong") return;
            const payload = JSON.parse(event.data);
            if (payload && payload.event) {
              eventHandlers[payload.event]?.forEach(cb => cb(payload.data));
            }
          } catch (err) {
            console.error("WebSocket message parse error:", err);
          }
        };
      };

      connectWs();

      // Ping keepalive every 20s
      pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, 20000);

      const socketFake = {
        on: (event: string, callback: (data: any) => void) => {
          if (!eventHandlers[event]) eventHandlers[event] = [];
          eventHandlers[event].push(callback);
        },
        disconnect: () => {
          if (reconnectTimeout) clearTimeout(reconnectTimeout);
          if (pingInterval) clearInterval(pingInterval);
          if (ws) {
            ws.onclose = null; // prevent reconnect loop
            ws.close();
          }
        }
      };

      socketRef.current = socketFake as any;

      socketFake.on("activity", (d) => onActivity(d));
      socketFake.on("stats_update", (d) => setStats((prev: any) => ({ ...prev, ...d })));
      socketFake.on("report_ready", (d) => {
        pushToast({ type: "report", icon: <FileText size={16} className="text-teal-500" />, title: "Report Ready", body: `Generated for ${d.filename || "dataset"}` });
        setPreviewReportId(d.report_id);
        loadReports();
      });
      socketFake.on("insight_ready", (d) => {
        pushToast({ type: "info", icon: <Lightbulb size={16} className="text-yellow-500" />, title: `${d.count} Insights Ready`, body: `${d.dataset_type} · ${d.filename}` });
      });
    };
    init();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const onActivity = (d: any) => {
    const icons: any = { eda: <BarChart size={16} className="text-purple-400" />, automl: <Bot size={16} className="text-blue-400" />, clean: <Sparkles size={16} className="text-emerald-400" />, query: <MessageSquare size={16} className="text-amber-400" />, insights: <Lightbulb size={16} className="text-indigo-400" />, report: <FileText size={16} className="text-teal-400" /> };
    const labels: any = { eda: "EDA", automl: "AutoML", clean: "Cleaning", query: "AI Query", insights: "Insights", report: "Report" };
    const item = {
      id: Date.now() + Math.random(),
      type: d.type,
      label: labels[d.type] || d.type,
      icon: icons[d.type] || <Zap size={16} className="text-indigo-400" />,
      summary: d.summary,
      filename: d.filename,
      time_ago: "just now",
      isNew: true,
    };
    setFeedItems((prev) => {
      const nw = [item, ...prev];
      if (nw.length > 60) nw.pop();
      return nw;
    });
    setNewEventCount((prev) => prev + 1);

    setTimeout(() => {
      setFeedItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, isNew: false } : x)));
      setNewEventCount((prev) => Math.max(0, prev - 1));
    }, 5000);

    if (feedScrollRef.current) feedScrollRef.current.scrollTop = 0;

    pushToast({ type: "info", icon: icons[d.type] || <Zap size={16} className="text-indigo-400" />, title: `${labels[d.type] || d.type} complete`, body: d.summary || d.filename || "" });
  };

  // Watches for activeTab
  useEffect(() => {
    if (activeTab === "account") {
      loadAccountDatasets();
      loadEdaReports();
    }
    if (activeTab === "assets" && !assetsLoading && assets.datasets.length === 0 && assets.models.length === 0 && assets.reports.length === 0) {
      loadAssets();
    }
  }, [activeTab]);

  // Loaders
  const loadReports = async () => {
    const { ok, data } = await apiFetch("/reports");
    if (ok && Array.isArray(data)) setReports(data);
  };
  const loadSchedules = async () => {
    const { ok, data } = await apiFetch("/schedules");
    if (ok && Array.isArray(data)) setSchedules(data);
  };
  const loadAccountDatasets = async () => {
    if (cleanedDatasets.length > 0) return;
    setAcctDatasetsLoading(true);
    const { ok, data } = await apiFetch("/account/datasets");
    setAcctDatasetsLoading(false);
    if (ok && Array.isArray(data)) setCleanedDatasets(data);
  };
  const loadEdaReports = async () => {
    if (edaReports.length > 0) return;
    setAcctEdaLoading(true);
    const { ok, data } = await apiFetch("/account/eda-reports");
    setAcctEdaLoading(false);
    if (ok && Array.isArray(data)) setEdaReports(data);
  };
  const loadAssets = async () => {
    setAssetsLoading(true);
    const { ok, data } = await apiFetch("/assets");
    setAssetsLoading(false);
    if (ok && data) setAssets({ datasets: data.datasets || [], models: data.models || [], reports: data.reports || [] });
  };

  

  const user = initData?.user || {};

  return (
    <>
      {showSplash && <SplashLoader isLoading={loading} onComplete={() => setShowSplash(false)} />}
      
      {loading ? null : error ? (
        <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
      ) : (
        <>
          <div className={styles.noise}></div>

      {/* TOASTS */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] space-y-2 pointer-events-none w-[90%] md:w-auto flex flex-col items-center" style={{ maxWidth: "380px" }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} pointer-events-auto ${toast.leaving ? styles.toastLeave : styles.toastEnter}`}
            style={{
              background: toast.type === "alert" ? "rgba(15,5,5,.94)" : toast.type === "report" ? "rgba(5,15,15,.94)" : "rgba(10,10,11,.94)",
              borderColor: toast.type === "alert" ? "rgba(239,68,68,.3)" : toast.type === "report" ? "rgba(20,184,166,.3)" : "var(--border)",
            }}
          >
            <div className="text-base flex-shrink-0 mt-0.5 leading-none">{toast.icon}</div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="text-[13px] font-bold" style={{ color: "var(--txt)" }}>{toast.title}</span> 
              {toast.body && <span className="text-[11px] opacity-70 leading-snug mt-0.5" style={{ color: "var(--txt)" }}>{toast.body}</span>}
            </div>
            <button onClick={() => dismissToast(toast.id)} className="flex-shrink-0 ml-1 mt-0.5 p-0.5 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--txt-m)" }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* NAV */}
      <nav className="sticky top-0 z-30 flex items-center gap-2 px-3 md:px-5 border-b backdrop-blur-md" style={{ background: "var(--nav)", borderColor: "var(--border)", height: "52px" }}>
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 no-underline">
          <Logo size={24} textSize={16} />
        </Link>
        <div className="flex-1"></div>

        <ThemeSwitcher />



        {/* Profile */}
        <UserMenu />
      </nav>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-7 space-y-6">

        {/* Welcome */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {user.avatar && <img src={user.avatar} className="w-12 h-12 rounded-full hidden sm:block" style={{ border: "2px solid var(--border)" }} />}
            <div>
              <p className={`${styles.sl} mb-1`}>Welcome back</p>
              <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${styles.gradTxt}`}>{user.name ? user.name.split(" ")[0] : "Analyst"}</h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--txt-m)" }}>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className={styles.statCard}>
            <div className="flex items-center justify-between mb-3"><p className={styles.sl}>Uploads</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--glow)" }}>
                <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
            </div>
            <p className={styles.statNum} style={{ color: "var(--accent)" }}>{stats.uploads}</p>
          </div>
          <div className={styles.statCard}>
            <div className="flex items-center justify-between mb-3"><p className={styles.sl}>Analyses</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,.12)" }}>
                <svg className="w-4 h-4" style={{ color: "#a78bfa" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
            </div>
            <p className={styles.statNum} style={{ color: "#a78bfa" }}>{stats.analyses}</p>
          </div>
          <div className={styles.statCard}>
            <div className="flex items-center justify-between mb-3"><p className={styles.sl}>Models</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,.12)" }}>
                <svg className="w-4 h-4" style={{ color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
            </div>
            <p className={styles.statNum} style={{ color: "#10b981" }}>{stats.models}</p>
          </div>
          <div className={styles.statCard}>
            <div className="flex items-center justify-between mb-3"><p className={styles.sl}>AI Queries</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,.12)" }}>
                <svg className="w-4 h-4" style={{ color: "#fbbf24" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
            </div>
            <p className={styles.statNum} style={{ color: "#fbbf24" }}>{stats.queries}</p>
          </div>
        </div>



        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Recent Uploads */}
            <div className={`lg:col-span-3 ${styles.gc} rounded-2xl overflow-hidden`}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <div><p className="font-bold text-sm" style={{ color: "var(--txt)" }}>Recent Uploads</p><p className={`${styles.sl} mt-0.5`}>Last {initData.recent_uploads.length} datasets</p></div>
                <Link href="/" className="text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: "var(--accent)", textDecoration: "none" }}>+ Upload</Link>
              </div>
              {initData.recent_uploads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className={styles.dt}>
                    <thead><tr><th>File</th><th>Src</th><th>Rows</th><th>Cols</th><th>Missing</th><th>When</th></tr></thead>
                    <tbody>
                      {initData.recent_uploads.map((up: any) => (
                        <tr key={up.id}>
                          <td><div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-black flex-shrink-0" style={{ background: "var(--accent)", color: "#fff" }}>{up.source_type === "sheets" ? "GS" : "CSV"}</div>
                            <span className="font-medium truncate" style={{ color: "var(--txt)", maxWidth: "140px" }}>{up.filename}</span>
                          </div></td>
                          <td><span className={styles.badge} style={{ background: "rgba(46,91,255,.07)", color: "var(--txt-m)", border: "1px solid var(--border)" }}>{up.source_type || "csv"}</span></td>
                          <td className="font-mono">{up.rows.toLocaleString()}</td>
                          <td className="font-mono">{up.cols}</td>
                          <td className="font-mono" style={{ color: up.missing_pct > 10 ? "#ef4444" : up.missing_pct > 2 ? "#fbbf24" : "#10b981" }}>{up.missing_pct}%</td>
                          <td style={{ color: "var(--txt-m)" }}>{up.time_ago}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--txt)" }}>No uploads yet</p>
                  <Link href="/" className={`${styles.btnP} text-xs mt-2`}>Upload CSV</Link>
                </div>
              )}
            </div>

            {/* Live Feed */}
            <div className={`lg:col-span-2 ${styles.gc} rounded-2xl overflow-hidden flex flex-col`}>
              <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--border)" }}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm" style={{ color: "var(--txt)" }}>Live Activity</p>
                    <div className={`${styles.ld} ${wsConnected ? "" : styles.offline}`}></div>
                  </div>
                  <p className={`${styles.sl} mt-0.5`}>Real-time analysis events</p>
                </div>
                {newEventCount > 0 && (
                  <span className={styles.badge} style={{ background: "rgba(46,91,255,.12)", color: "var(--accent)", border: "1px solid rgba(46,91,255,.25)" }}>
                    {newEventCount} new
                  </span>
                )}
              </div>
              <div className="overflow-y-auto flex-1 p-3 space-y-1" style={{ maxHeight: "430px" }} ref={feedScrollRef}>
                {feedItems.length > 0 ? feedItems.map((item) => (
                  <div key={item.id} className={`${styles.feedItem} flex items-start gap-3 p-3 rounded-xl transition-all`} style={{ background: item.isNew ? "var(--glow)" : "rgba(255,255,255,.02)", boxShadow: item.isNew ? "inset 0 0 0 1px var(--border)" : "" }}>
                    <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`${styles.badge} ${styles["badge" + item.type.charAt(0).toUpperCase() + item.type.slice(1)]}`}>{item.label}</span>
                        {item.isNew && <span className={styles.badge} style={{ background: "var(--glow)", color: "var(--accent)", border: "1px solid var(--border)", fontSize: ".55rem" }}>NEW</span>}
                      </div>
                      {item.filename && <p className="text-[10px] font-medium truncate" style={{ color: "var(--txt)" }}>{item.filename}</p>}
                      {item.summary && <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--txt-m)" }}>{item.summary}</p>}
                      <p className="text-[9px] mt-1 opacity-60" style={{ color: "var(--txt-m)" }}>{item.time_ago}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--glow)" }}>
                      <svg className="w-5 h-5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <p className="text-xs font-bold mb-1" style={{ color: "var(--txt)" }}>Waiting for events</p>
                    <p className="text-[10px]" style={{ color: "var(--txt-m)" }}>Run analyses in the workspace</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === "insights" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div><p className="font-bold" style={{ color: "var(--txt)" }}>Automated Insights</p><p className={`${styles.sl} mt-0.5`}>AI-generated intelligence from your latest dataset</p></div>
              <button onClick={async () => {
                setInsightsLoading(true); setInsightError("");
                const { ok, data, error } = await apiFetch("/insights/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ top_n: 8, use_gemini: true }) });
                setInsightsLoading(false);
                if (!ok) { setInsightError(error); return; }
                setInsights(data.insights || []); setInsightSummary(data.summary || "");
              }} disabled={insightsLoading} className={styles.btnP}>
                <svg className={`w-4 h-4 ${insightsLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24">
                  {insightsLoading ? (
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  )}
                </svg>
                {insightsLoading ? "Analysing..." : "Run Insights"}
              </button>
            </div>
            {insightSummary && (
              <div className="p-5 rounded-2xl" style={{ background: "rgba(99,102,241,.07)", border: "1px solid rgba(99,102,241,.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4" style={{ color: "#818cf8" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  <p className="font-bold text-xs" style={{ color: "#818cf8" }}>AI Executive Summary</p>
                </div>
                <div className="text-sm leading-relaxed" style={{ color: "var(--txt)" }}>{insightSummary}</div>
              </div>
            )}
            {insightError && (
              <div className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)" }}>
                <p className="text-xs font-bold text-red-400">{insightError}</p>
              </div>
            )}
            {insights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((ins, i) => (
                  <div key={i} className={styles.insightCard}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm leading-tight" style={{ color: "var(--txt)" }}>{ins.title}</p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--txt-m)" }}>{ins.description}</p>
                      </div>
                      <span className={`${styles.badge} flex-shrink-0`} style={{ background: "rgba(99,102,241,.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,.2)" }}>{ins.type}</span>
                    </div>
                    <div className={styles.impBar}><div className={styles.impFill} style={{ width: (ins.importance * 100).toFixed(0) + "%" }}></div></div>
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--txt-m)" }}>Importance: <span style={{ color: "var(--txt)" }}>{(ins.importance * 100).toFixed(0)}%</span></p>
                  </div>
                ))}
              </div>
            ) : (!insightsLoading && !insightSummary && (
              <div className={`flex flex-col items-center justify-center py-16 ${styles.gc} rounded-2xl text-center`}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(99,102,241,.08)" }}>
                  <svg className="w-8 h-8" style={{ color: "#818cf8" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                <p className="font-bold text-sm mb-1" style={{ color: "var(--txt)" }}>No insights yet</p>
                <p className="text-xs mb-4" style={{ color: "var(--txt-m)" }}>Upload a dataset, then click Run Insights</p>
              </div>
            ))}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div><p className="font-bold" style={{ color: "var(--txt)" }}>Generated Reports</p><p className={`${styles.sl} mt-0.5`}>Automated HTML reporting engine</p></div>
              <button onClick={async () => {
                setReportLoading(true);
                const { ok, data, error } = await apiFetch("/reports/generate", { method: "POST" });
                setReportLoading(false);
                if (!ok) { pushToast({ type: "alert", icon: <XCircle size={16} className="text-red-500" />, title: "Report failed", body: error }); return; }
                if (data && data.report_id) { setPreviewReportId(data.report_id); loadReports(); }
              }} disabled={reportLoading} className={styles.btnP}>
                <svg className={`w-4 h-4 ${reportLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24">
                  {reportLoading ? (
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  )}
                </svg>
                {reportLoading ? "Generating..." : "Generate Report"}
              </button>
            </div>
            {previewReportId && (
              <div className={`${styles.gc} rounded-2xl overflow-hidden`}>
                <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                  <p className="font-bold text-sm" style={{ color: "var(--txt)" }}>Report Preview</p>
                  <div className="flex gap-2">
                    <a href={`/api/reports/${previewReportId}`} target="_blank" rel="noreferrer" className={`${styles.btnS} text-[10px] py-1.5 px-3`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Open Full
                    </a>
                    <a href={`/api/reports/${previewReportId}?format=pdf`} target="_blank" rel="noreferrer" className={`${styles.btnP} text-[10px] py-1.5 px-3`}>📄 Download PDF</a>
                  </div>
                </div>
                <iframe src={`/api/reports/${previewReportId}`} className="w-full rounded-b-2xl block" style={{ height: "640px", border: 0, background: "#E2E8F0" }}></iframe>
              </div>
            )}
            <div className={`${styles.gc} rounded-2xl overflow-hidden`}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}><p className="font-bold text-sm" style={{ color: "var(--txt)" }}>All Reports</p></div>
              {reports.length > 0 ? (
                <table className={styles.dt}>
                  <thead><tr><th>Dataset</th><th>Type</th><th>Created</th><th>Action</th></tr></thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td className="font-medium" style={{ color: "var(--txt)" }}>{r.filename || "Dataset"}</td>
                        <td><span className={`${styles.badge} ${styles.badgeReport}`}>{r.triggered_by}</span></td>
                        <td style={{ color: "var(--txt-m)" }}>{timeAgo(r.created_at)}</td>
                        <td><button onClick={() => setPreviewReportId(r.id)} className={styles.badge} style={{ background: "rgba(46,91,255,.1)", color: "var(--accent)", border: "1px solid rgba(46,91,255,.2)" }}>Preview</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center"><p className="text-xs font-bold mb-1" style={{ color: "var(--txt)" }}>No reports generated yet</p></div>
              )}
            </div>
          </div>
        )}

        {/* SCHEDULES TAB */}
        {activeTab === "schedules" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div><p className="font-bold" style={{ color: "var(--txt)" }}>Report Schedules</p><p className={`${styles.sl} mt-0.5`}>Automated recurring report delivery</p></div>
              <button onClick={() => setShowNewSchedule(!showNewSchedule)} className={styles.btnP}>
                <Plus className="w-4 h-4" />
                New Schedule
              </button>
            </div>
            {showNewSchedule && (
              <div className={`${styles.gc} rounded-2xl p-5 space-y-4`}>
                <p className="font-bold text-sm" style={{ color: "var(--txt)" }}>New Report Schedule</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={styles.sl}>Frequency</label>
                    <select value={newSched.cron} onChange={(e) => { setNewSched({ ...newSched, cron: e.target.value }); setSchedErrors({ ...schedErrors, cron: V.cron(e.target.value) || "" }); }}
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--txt)", borderColor: schedErrors.cron ? "#ef4444" : undefined }}
                      className="w-full px-3 py-2 rounded-lg text-xs font-medium outline-none">
                      <option value="0 9 * * 1">Every Monday 9AM</option>
                      <option value="0 9 * * *">Every day 9AM</option>
                      <option value="0 9 1 * *">Monthly (1st)</option>
                      <option value="0 9 * * 1-5">Weekdays 9AM</option>
                    </select>
                    {schedErrors.cron && <p className="text-[10px] font-semibold" style={{ color: "#ef4444" }}>{schedErrors.cron}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className={styles.sl}>Email <span style={{ color: "var(--txt-m)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                    <input value={newSched.email} onChange={(e) => { setNewSched({ ...newSched, email: e.target.value }); if (schedErrors.email) setSchedErrors({ ...schedErrors, email: V.email(e.target.value) || "" }); }} onBlur={() => setSchedErrors({ ...schedErrors, email: V.email(newSched.email) || "" })}
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--txt)", borderColor: schedErrors.email ? "#ef4444" : undefined }}
                      type="email" placeholder="you@company.com" className="w-full px-3 py-2 rounded-lg text-xs outline-none" />
                    {schedErrors.email && <p className="text-[10px] font-semibold" style={{ color: "#ef4444" }}>{schedErrors.email}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    const cErr = V.cron(newSched.cron); const eErr = V.email(newSched.email);
                    setSchedErrors({ cron: cErr || "", email: eErr || "" });
                    if (cErr || eErr) return;
                    setSchedLoading(true);
                    const { ok, data, error } = await apiFetch("/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cron: newSched.cron.trim(), email: newSched.email.trim() }) });
                    setSchedLoading(false);
                    if (!ok) { pushToast({ type: "alert", icon: <XCircle size={16} className="text-red-500" />, title: "Could not create schedule", body: error }); return; }
                    setShowNewSchedule(false); setNewSched({ cron: "0 9 * * 1", email: "" }); setSchedErrors({ cron: "", email: "" });
                    loadSchedules(); pushToast({ type: "info", icon: <Calendar size={16} className="text-blue-500" />, title: "Schedule created", body: data.cron_human });
                  }} disabled={schedLoading} className={styles.btnP}>{schedLoading ? "Creating..." : "Create Schedule"}</button>
                  <button onClick={() => { setShowNewSchedule(false); setSchedErrors({ cron: "", email: "" }); }} className={styles.btnS}>Cancel</button>
                </div>
              </div>
            )}
            {schedules.length > 0 ? (
              <div className={`${styles.gc} rounded-2xl overflow-hidden`}>
                <table className={styles.dt}>
                  <thead><tr><th>Dataset</th><th>Frequency</th><th>Email</th><th>Last Run</th><th></th></tr></thead>
                  <tbody>
                    {schedules.map((s) => (
                      <tr key={s.id}>
                        <td className="font-medium" style={{ color: "var(--txt)" }}>{s.filename || "Dataset"}</td>
                        <td><span className={`${styles.badge} ${styles.badgeInsights}`}>{s.cron_human}</span></td>
                        <td style={{ color: "var(--txt-m)" }}>{s.email || "—"}</td>
                        <td style={{ color: "var(--txt-m)" }}>{s.last_run ? timeAgo(s.last_run) : "Never"}</td>
                        <td><button onClick={async () => {
                          const { ok } = await apiFetch(`/schedules/${s.id}`, { method: "DELETE" });
                          if (ok) setSchedules(schedules.filter((x) => x.id !== s.id));
                        }} className={styles.badge} style={{ background: "rgba(239,68,68,.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,.2)" }}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (!showNewSchedule && (
              <div className={`flex flex-col items-center justify-center py-16 ${styles.gc} rounded-2xl text-center`}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(46,91,255,.08)" }}>
                  <svg className="w-7 h-7" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="font-bold text-sm mb-1" style={{ color: "var(--txt)" }}>No schedules configured</p>
                <p className="text-xs mb-4" style={{ color: "var(--txt-m)" }}>Automate report delivery on a cadence</p>
              </div>
            ))}
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <div className={`${styles.gc} rounded-2xl p-6`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(46,91,255,.1)" }}>
                  <svg className="w-5 h-5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div><p className="font-bold text-sm" style={{ color: "var(--txt)" }}>My Account</p><p className={`${styles.sl} mt-0.5`}>Edit your profile name</p></div>
              </div>

              <div className="flex flex-1 flex-col sm:flex-row items-start gap-6">
                <div className="flex-1 space-y-5 w-full">
                  <div className="space-y-1.5">
                    <label className={styles.sl}>Display Name</label>
                    <input value={acct.name} onChange={(e) => setAcct((prev: any) => ({ ...prev, name: e.target.value }))} type="text" placeholder="Your name" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--txt)" }} />
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={saveAccount} disabled={acctSaving} className={styles.btnP}>
                      <svg className={`w-4 h-4 ${acctSaving ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24">
                        {acctSaving ? (
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        )}
                      </svg>
                      {acctSaving ? "Saving..." : "Save Changes"}
                    </button>
                    {acctMsg && <p className="text-xs font-bold" style={{ color: acctMsgOk ? "#10b981" : "#ef4444" }}>{acctMsg}</p>}
                  </div>
                </div>
              </div>
            </div>
            {/* Cleaned Datasets */}
            <div className={`${styles.gc} rounded-2xl overflow-hidden`}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <div><p className="font-bold text-sm" style={{ color: "var(--txt)" }}>Cleaned Datasets</p></div>
                <span className={styles.badge} style={{ background: "rgba(16,185,129,.1)", color: "#10b981", border: "1px solid rgba(16,185,129,.25)" }}>{cleanedDatasets.filter((d) => d.has_clean).length} cleaned</span>
              </div>
              {acctDatasetsLoading ? (
                <div className="flex items-center justify-center py-10"><svg className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
              ) : cleanedDatasets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className={styles.dt}>
                    <thead><tr><th>File</th><th>Src</th><th>Rows</th><th>Cols</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {cleanedDatasets.map((d: any) => (
                        <tr key={d.id}>
                          <td><span className="font-medium" style={{ color: "var(--txt)" }}>{d.filename}</span></td>
                          <td><span className={styles.badge} style={{ background: "rgba(46,91,255,.07)", color: "var(--txt-m)", border: "1px solid var(--border)" }}>{d.source_type || "csv"}</span></td>
                          <td className="font-mono">{d.rows}</td>
                          <td className="font-mono">{d.cols}</td>
                          <td>
                            {d.has_clean ? <span className={styles.badge} style={{ background: "rgba(16,185,129,.1)", color: "#10b981", border: "1px solid rgba(16,185,129,.25)" }}>Cleaned</span> : <span className={styles.badge} style={{ background: "rgba(255,255,255,.05)", color: "var(--txt-m)", border: "1px solid var(--border)" }}>Raw only</span>}
                          </td>
                          <td><Link href={`/workspace?upload_id=${d.id}`} className={styles.badge} style={{ background: "rgba(46,91,255,.1)", color: "var(--accent)", border: "1px solid rgba(46,91,255,.2)", textDecoration: "none" }}>Open</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--txt)" }}>No datasets yet</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
      
        </>
      )}
    </>
  );
}
