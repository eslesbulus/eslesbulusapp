// API layer — real backend integration
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const API_BASE = '/admin/api';

function getToken() {
  return localStorage.getItem('eb_token') || '';
}

async function api(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('eb_token');
    window.location.reload();
    throw new Error('Oturum suresi doldu');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API hatasi');
  return data;
}

// Hook: fetch data with loading/error
function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api(path);
      setData(d);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [path, ...deps]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload, setData };
}

// Format helpers
function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: '2-digit' });
}
function fmtNum(n) {
  if (n == null) return '-';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString('tr-TR');
}
function timeAgo(d) {
  if (!d) return '-';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'simdi';
  if (mins < 60) return mins + ' dk once';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' sa once';
  return Math.floor(hrs / 24) + ' gun once';
}

// Loading spinner component
const Loader = ({ text = 'Yukleniyor...' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12 }}>
    <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTop: '3px solid var(--purple)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <div style={{ color: 'var(--text-3)', fontSize: 13 }}>{text}</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Error display
const ErrorBox = ({ msg, onRetry }) => (
  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
    <div style={{ color: 'var(--red)', fontSize: 14, marginBottom: 12 }}>{msg}</div>
    {onRetry && <button className="btn btn--ghost" onClick={onRetry}><Icon name="refresh" /> Tekrar dene</button>}
  </div>
);

// Toast notification
let _toastTimeout;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast-container');
  if (!el) return;
  el.innerHTML = `<div style="
    position: fixed; bottom: 24px; right: 24px; z-index: 100;
    padding: 12px 18px; border-radius: 10px;
    background: ${type === 'success' ? 'rgba(16,185,129,0.15)' : type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(168,85,247,0.15)'};
    border: 1px solid ${type === 'success' ? 'rgba(16,185,129,0.3)' : type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(168,85,247,0.3)'};
    color: ${type === 'success' ? '#34d399' : type === 'error' ? '#f87171' : '#c4b5fd'};
    font-size: 13px; font-weight: 600;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: fade 0.2s ease;
  ">${msg}</div>`;
  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => { el.innerHTML = ''; }, 3500);
}

Object.assign(window, {
  api, getToken, useApi, fmtDate, fmtNum, timeAgo,
  Loader, ErrorBox, showToast,
});
