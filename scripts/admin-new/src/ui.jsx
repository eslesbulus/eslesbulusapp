// Shared UI primitives
const { useState, useEffect, useRef, useMemo } = React;

const Avatar = ({ name, online, size = 'md', gradient, src }) => {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [src]);
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
  // pseudo-randomized hue based on name
  const hue = name ? Math.abs([...name].reduce((a, c) => a + c.charCodeAt(0), 0)) % 360 : 280;
  const cls = `avatar ${size === 'lg' ? 'avatar--lg' : size === 'xl' ? 'avatar--xl' : ''}`;
  const bg = gradient
    ? 'linear-gradient(135deg, #a855f7, #ec4899)'
    : `linear-gradient(135deg, oklch(0.62 0.18 ${hue}), oklch(0.55 0.22 ${(hue+40)%360}))`;
  const showImg = src && !imgError;
  return (
    <div className={cls} style={{ background: showImg ? 'var(--bg-2)' : bg }}>
      {showImg ? (
        <img
          src={src}
          alt={name || ''}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
        />
      ) : initials}
      {online !== undefined && <span className={`avatar__dot ${online ? 'avatar__dot--online' : ''}`} />}
    </div>
  );
};

const Badge = ({ variant = 'gray', children, dot }) => (
  <span className={`badge badge--${variant}`}>
    {dot && <span className={`dot dot--${dot}`} style={{ width: 6, height: 6, boxShadow: 'none' }} />}
    {children}
  </span>
);

const Switch = ({ on, onChange, size }) => (
  <div
    className={`switch ${on ? 'on' : ''} ${size === 'lg' ? 'lg' : ''}`}
    onClick={() => onChange && onChange(!on)}
    role="switch"
    aria-checked={on}
  />
);

const ToggleRow = ({ label, sub, on, onChange, lg }) => (
  <div className="toggle-row">
    <div>
      <div className="toggle-row__label">{label}</div>
      {sub && <div className="toggle-row__sub">{sub}</div>}
    </div>
    <Switch on={on} onChange={onChange} size={lg ? 'lg' : null} />
  </div>
);

const Field = ({ label, hint, children }) => (
  <div className="field">
    {label && <label className="field__label">{label}</label>}
    {children}
    {hint && <div className="field__hint">{hint}</div>}
  </div>
);

const Slider = ({ value, onChange, min, max, step = 1, format = (v) => v }) => (
  <div className="slider-row">
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    <span className="slider-row__val">{format(value)}</span>
  </div>
);

const Drawer = ({ open, onClose, title, children, foot, width }) => (
  <>
    <div className={`drawer-backdrop ${open ? 'show' : ''}`} onClick={onClose} />
    <aside className={`drawer ${open ? 'show' : ''}`} style={width ? { width } : null}>
      <div className="drawer__head">
        <div className="drawer__title">{title}</div>
        <button className="icon-btn" onClick={onClose} aria-label="Kapat"><Icon name="close" /></button>
      </div>
      <div className="drawer__body">{children}</div>
      {foot && <div className="drawer__head" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none', justifyContent: 'flex-end', gap: 8 }}>{foot}</div>}
    </aside>
  </>
);

const Modal = ({ open, onClose, title, sub, children, foot }) => (
  <div className={`modal-backdrop ${open ? 'show' : ''}`} onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal__head">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
            {sub && <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>{sub}</div>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Kapat"><Icon name="close" /></button>
        </div>
      </div>
      <div className="modal__body">{children}</div>
      {foot && <div className="modal__foot">{foot}</div>}
    </div>
  </div>
);

const Pagination = ({ page = 1, total = 1, onChange, totalRows }) => {
  const pages = [];
  for (let i = 1; i <= Math.min(total, 5); i++) pages.push(i);
  return (
    <div className="pagination">
      <div>{totalRows ? <><span className="mono" style={{ color: 'var(--text)' }}>{totalRows}</span> kayıt bulundu</> : null}</div>
      <div className="pagination__pages">
        <button className="page-btn" onClick={() => onChange && onChange(Math.max(1, page-1))} disabled={page===1}><Icon name="chevL" size={13} /></button>
        {pages.map(p => (
          <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onChange && onChange(p)}>{p}</button>
        ))}
        {total > 5 && <span style={{ color: 'var(--text-dim)', padding: '0 4px' }}>…</span>}
        {total > 5 && <button className="page-btn" onClick={() => onChange && onChange(total)}>{total}</button>}
        <button className="page-btn" onClick={() => onChange && onChange(Math.min(total, page+1))} disabled={page===total}><Icon name="chevR" size={13} /></button>
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value, trend, trendValue }) => (
  <div className="stat">
    <div className="stat__icon"><Icon name={icon} /></div>
    <div className="stat__label">{label}</div>
    <div className="stat__value">{value}</div>
    {trend && (
      <div className={`stat__trend ${trend}`}>
        <Icon name={trend === 'up' ? 'arrowUp' : 'arrowDown'} />
        {trendValue}
      </div>
    )}
  </div>
);

// Line chart — SVG
const LineChart = ({ data, height = 200, color1 = '#a855f7', color2 = '#ec4899' }) => {
  const w = 600, h = height, pad = { l: 40, r: 20, t: 20, b: 28 };
  const max = Math.max(...data.map(d => d.v)) * 1.2;
  const min = 0;
  const xStep = (w - pad.l - pad.r) / (data.length - 1);
  const pts = data.map((d, i) => ({
    x: pad.l + i * xStep,
    y: pad.t + (h - pad.t - pad.b) * (1 - (d.v - min) / (max - min || 1))
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length-1].x} ${h-pad.b} L ${pts[0].x} ${h-pad.b} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: pad.t + (h - pad.t - pad.b) * (1 - t),
    v: Math.round(max * t)
  }));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lc-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color1} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color2} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lc-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={w-pad.r} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.04)" />
          <text x={pad.l-8} y={t.y+4} fontSize="10" textAnchor="end" fill="#64748b" fontFamily="JetBrains Mono">{t.v}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#lc-area)" />
      <path d={linePath} stroke="url(#lc-line)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#0a0e1a" stroke="url(#lc-line)" strokeWidth="2" />
          <text x={p.x} y={h-pad.b+18} fontSize="10" textAnchor="middle" fill="#64748b">{data[i].l}</text>
        </g>
      ))}
    </svg>
  );
};

// Donut chart
const Donut = ({ data, size = 200 }) => {
  const total = data.reduce((a, d) => a + d.v, 0);
  const r = size / 2 - 14, cx = size/2, cy = size/2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
      {data.map((d, i) => {
        const frac = d.v / total;
        const len = C * frac;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={d.color}
            strokeWidth="18"
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
      <text x={cx} y={cy-4} fontSize="22" textAnchor="middle" fill="white" fontWeight="700" fontFamily="JetBrains Mono">
        {total.toLocaleString('tr-TR')}
      </text>
      <text x={cx} y={cy+16} fontSize="11" textAnchor="middle" fill="#64748b">Toplam</text>
    </svg>
  );
};

// Sparkline (tiny line)
const Sparkline = ({ data, color = '#a855f7', height = 32, width = 90 }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={pts} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
};

Object.assign(window, {
  Avatar, Badge, Switch, ToggleRow, Field, Slider,
  Drawer, Modal, Pagination, Stat,
  LineChart, Donut, Sparkline,
});
