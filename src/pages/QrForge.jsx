/**
 * QR Forge — Admin QR Code Generator
 *
 * Features:
 *  • Live high-resolution QR preview (transparent + white variants)
 *  • Permanent redirect URL baked into every QR — reprogrammable without
 *    reprinting (admin changes destination, all existing QR codes follow)
 *  • Multi-size download: shirt (1200px), banner (3000px), sticker (600px),
 *    print-ready (5000px), all as PNG
 *  • Transparent-background export option (for printing on garments/merch)
 *  • Live site preview card showing what the destination looks like
 *  • Destination history log (last 5 changes stored in localStorage)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  QrCode, Download, Link2, RefreshCw, Check, Printer,
  Monitor, Shirt, ImageIcon, AlertCircle, Clock, ExternalLink,
  ChevronDown, Loader2, Sparkles, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const PERMANENT_QR_URL = `${API_BASE}/api/qr/go`;

const SIZES = [
  { key: 'sticker', label: 'Sticker',       sub: '600 px',  px: 600,  Icon: ImageIcon },
  { key: 'shirt',   label: 'T-Shirt',        sub: '1200 px', px: 1200, Icon: Shirt     },
  { key: 'banner',  label: 'Banner / Print', sub: '3000 px', px: 3000, Icon: Printer   },
  { key: 'ultra',   label: 'Ultra HD',       sub: '5000 px', px: 5000, Icon: Monitor   },
];

const HISTORY_KEY = 'azm_qr_dest_history';

// ── API helpers ───────────────────────────────────────────────────────────────
async function fetchDestination() {
  const res = await fetch(`${API_BASE}/api/qr/destination`);
  if (!res.ok) throw new Error('Failed to load destination');
  return res.json();
}

async function patchDestination({ url, label }) {
  const token =
    localStorage.getItem('azm_admin_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('azm_token') || '';
  const res = await fetch(`${API_BASE}/api/qr/destination`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url, label }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Update failed');
  return data;
}

// ── QR canvas renderer ────────────────────────────────────────────────────────
async function renderQR(canvas, url, { size = 400, transparent = false, margin = 2 } = {}) {
  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin,
    color: {
      dark: '#000000',
      light: transparent ? '#00000000' : '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

async function renderQRDataUrl(url, px, transparent) {
  const offscreen = document.createElement('canvas');
  await renderQR(offscreen, url, { size: px, transparent, margin: transparent ? 1 : 2 });
  return offscreen.toDataURL('image/png');
}

// ── History helpers ───────────────────────────────────────────────────────────
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(url, label) {
  const h = loadHistory().filter((e) => e.url !== url);
  h.unshift({ url, label, ts: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 5)));
}

// ── Main component ────────────────────────────────────────────────────────────
export default function QrForge() {
  const qc = useQueryClient();

  const { data: dest, isLoading: destLoading } = useQuery({
    queryKey: ['qr-destination'],
    queryFn: fetchDestination,
    staleTime: 30_000,
  });

  const [editUrl,   setEditUrl]   = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [transparent, setTransparent] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory]         = useState(loadHistory);
  const [saved, setSaved]             = useState(false);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (dest && !editUrl) {
      setEditUrl(dest.url   || '');
      setEditLabel(dest.label || '');
    }
  }, [dest]);

  const canvasRef = useRef(null);

  const drawPreview = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      await renderQR(canvasRef.current, PERMANENT_QR_URL, {
        size: 360,
        transparent,
        margin: transparent ? 1 : 2,
      });
    } catch (e) {
      console.error('QR render error', e);
    }
  }, [transparent]);

  useEffect(() => { drawPreview(); }, [drawPreview]);

  const update = useMutation({
    mutationFn: patchDestination,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['qr-destination'] });
      saveHistory(data.url, data.label);
      setHistory(loadHistory());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success('QR destination updated — all printed codes now point here.');
    },
    onError: (e) => toast.error(e.message || 'Failed to update destination'),
  });

  const handleDownload = async (sizeKey) => {
    const sizeConfig = SIZES.find((s) => s.key === sizeKey);
    if (!sizeConfig) return;
    setDownloading(sizeKey);
    try {
      const dataUrl = await renderQRDataUrl(PERMANENT_QR_URL, sizeConfig.px, transparent);
      const a = document.createElement('a');
      a.download = `azaman_qr_${sizeKey}_${sizeConfig.px}px${transparent ? '_transparent' : ''}.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloaded ${sizeConfig.label} (${sizeConfig.px}px)`);
    } catch (e) {
      toast.error('Download failed — ' + e.message);
    } finally {
      setDownloading(null);
    }
  };

  const currentDest  = dest?.url   || 'https://startup.moolre.com/leaderboard/118';
  const currentLabel = dest?.label || 'Azaman Vote Page';

  return (
    <div className="max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-yellow-400" />
            QR Forge
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Generate high-resolution, print-ready QR codes. Reprogram the destination any time — no reprinting needed.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Live redirect active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* Left column */}
        <div className="space-y-5">

          {/* Permanent URL */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-slate-200">Permanent QR URL</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">baked into every printed code</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5">
              <code className="text-xs text-yellow-300 flex-1 truncate font-mono">{PERMANENT_QR_URL}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(PERMANENT_QR_URL); toast.success('Copied!'); }}
                className="text-slate-500 hover:text-white transition-colors text-xs px-2 py-0.5 rounded"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              This URL never changes. It instantly redirects visitors to the destination below.
            </p>
          </div>

          {/* Destination editor */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-slate-200">Current Destination</span>
              {destLoading && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700 rounded-lg">
              <a
                href={currentDest}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex-1 truncate flex items-center gap-1.5 transition-colors"
              >
                {currentLabel}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              <span className="text-xs text-slate-500 truncate max-w-[200px] hidden sm:block">{currentDest}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">New Destination URL</label>
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Label (for your records)</label>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                  placeholder="e.g. Moolre Vote Page"
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  onClick={() => update.mutate({ url: editUrl, label: editLabel })}
                  disabled={update.isPending || !editUrl || editUrl === currentDest}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-semibold gap-1.5"
                >
                  {update.isPending
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : saved
                      ? <Check className="w-3.5 h-3.5" />
                      : <RefreshCw className="w-3.5 h-3.5" />}
                  {saved ? 'Saved!' : 'Reprogram Destination'}
                </Button>

                {history.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowHistory((v) => !v)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-600"
                    >
                      <Clock className="w-3 h-3" />
                      History
                      <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                    </button>
                    {showHistory && (
                      <div className="absolute top-full mt-1 left-0 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {history.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => { setEditUrl(h.url); setEditLabel(h.label || ''); setShowHistory(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                          >
                            <p className="text-sm text-white font-medium truncate">{h.label || 'Unlabelled'}</p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{h.url}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Download panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-200">Download Sizes</span>
              </div>
              <button
                onClick={() => setTransparent((v) => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  transparent
                    ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                {transparent ? 'Transparent BG ✓' : 'White BG'}
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {transparent
                ? 'Transparent — ideal for garments, merch, and dark surfaces.'
                : 'White background — best for paper, flyers, and light surfaces.'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {SIZES.map(({ key, label, sub, Icon }) => {
                const isDownloading = downloading === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleDownload(key)}
                    disabled={!!downloading}
                    className="flex items-center gap-3 p-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl transition-all group disabled:opacity-60 text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center shrink-0 transition-colors">
                      {isDownloading
                        ? <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                        : <Icon className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-slate-500">{sub}</p>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                All exports use <strong className="text-slate-200">Error Correction Level H</strong> — the QR scans even if 30% is covered by a logo or worn. For large print jobs use <strong className="text-slate-200">Ultra HD (5000px)</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Right column — preview */}
        <div className="space-y-4">

          {/* QR canvas */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-400 mb-3 text-center">
              Preview — scan to test the redirect
            </p>
            <div
              className="relative rounded-2xl flex items-center justify-center p-4"
              style={transparent ? {
                backgroundImage: 'repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%)',
                backgroundSize: '16px 16px',
              } : { backgroundColor: '#ffffff' }}
            >
              <canvas ref={canvasRef} className="rounded-lg max-w-full block" />
            </div>
            {transparent && (
              <p className="text-center text-xs text-slate-500 mt-2">Checkerboard = transparent pixels</p>
            )}
          </div>

          {/* Destination preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-400 font-medium">Destination Preview</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500/60" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-xs text-slate-400 truncate flex-1 font-mono">{currentDest}</span>
              </div>

              <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                <div className="h-2 bg-gradient-to-r from-yellow-500 via-yellow-400 to-orange-500" />
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-black text-slate-900">A</div>
                    <div>
                      <p className="text-sm font-bold text-white">Azaman</p>
                      <p className="text-xs text-slate-400">Moolre Startup Leaderboard</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Scan this QR to vote for Azaman on the Moolre leaderboard. Every vote counts toward startup funding.
                  </p>
                  <a
                    href={currentDest}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open destination
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Info callout */}
          <div className="flex items-start gap-2.5 p-3.5 bg-blue-500/8 border border-blue-500/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-blue-300">No reprinting ever needed.</strong> When you change the destination above, every already-printed QR code updates instantly via the permanent relay URL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
