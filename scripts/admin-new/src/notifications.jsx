const NotificationsPage = () => {
  const [audience, setAudience] = useState('all');   // all|male|female|premium|specific
  const [mode, setMode] = useState('both');          // both|push|inapp
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Kullanici secici
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [pickerQ, setPickerQ] = useState('');
  const [pickerGender, setPickerGender] = useState('all');
  const [selected, setSelected] = useState(() => new Set());

  const loadUsers = async () => {
    try {
      const data = await api('/users?limit=1000');
      const list = (data.users || data || []).filter(u => u.role !== 'fake-bot' && u.role !== 'fake-manual');
      setAllUsers(list);
      setUsersLoaded(true);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { if (audience === 'specific' && !usersLoaded) loadUsers(); }, [audience]);

  const isFemale = (g) => g === 'Kadın' || g === 'Kadin';
  const pickerList = allUsers.filter(u => {
    if (pickerGender === 'F' && !isFemale(u.gender)) return false;
    if (pickerGender === 'M' && u.gender !== 'Erkek') return false;
    if (pickerQ && !(u.name || '').toLowerCase().includes(pickerQ.toLowerCase())) return false;
    return true;
  });

  const toggleUser = (uid) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };
  const selectAllVisible = () => setSelected(new Set(pickerList.map(u => u.uid)));
  const clearSelection = () => setSelected(new Set());

  const doSend = async () => {
    if (!title.trim() || !message.trim()) { showToast('Baslik ve mesaj gerekli', 'error'); return; }
    if (audience === 'specific' && selected.size === 0) { showToast('En az bir kullanici sec', 'error'); return; }
    setSending(true);
    try {
      const body = { title: title.trim(), body: message.trim(), target: audience, mode };
      if (audience === 'specific') body.uids = [...selected];
      const res = await api('/notifications/send', { method: 'POST', body });
      showToast(`Gonderildi — ${res.sent || 0} kullanici`);
      setTitle(''); setMessage('');
    } catch (e) {
      showToast(e.message, 'error');
    }
    setSending(false);
  };

  const AUDIENCES = [
    { id: 'all',      label: 'Tum Kullanicilar', icon: 'users',  sub: 'Herkese' },
    { id: 'female',   label: 'Kizlar',           icon: 'female', sub: 'Kadin kullanicilar' },
    { id: 'male',     label: 'Erkekler',         icon: 'male',   sub: 'Erkek kullanicilar' },
    { id: 'premium',  label: 'Premium',          icon: 'crown',  sub: 'Premium uyeler' },
    { id: 'specific', label: 'Secili Kisiler',   icon: 'user',   sub: selected.size + ' secili' },
  ];

  const MODES = [
    { id: 'both',  label: 'Push + Uygulama ici', icon: 'bell',  desc: 'Telefon bildirimi ve uygulama ici' },
    { id: 'push',  label: 'Sadece Push',         icon: 'send',  desc: 'Yalnizca telefon bildirimi' },
    { id: 'inapp', label: 'Sadece Uygulama ici', icon: 'eye',   desc: 'Bildirim canina duser, push gitmez' },
  ];

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div>
          <h1>Bildirimler</h1>
          <p>Hedef kitleye uygulama ici ve/veya push bildirim gonder</p>
        </div>
      </div>

      <div className="grid-2-1">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hedef kitle */}
          <div className="card">
            <div className="card__head"><div><div className="card__title">Hedef Kitle</div><div className="card__sub">Kime gonderilecek</div></div></div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {AUDIENCES.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setAudience(o.id)}
                    style={{
                      textAlign: 'left', padding: 12, borderRadius: 10,
                      background: audience === o.id ? 'var(--grad-soft)' : 'var(--bg-2)',
                      border: `1px solid ${audience === o.id ? 'rgba(168,85,247,0.4)' : 'var(--border)'}`,
                      color: 'var(--text)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(168,85,247,0.15)', display: 'grid', placeItems: 'center', color: '#f9a8d4' }}>
                      <Icon name={o.icon} size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{o.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.sub}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Kullanici secici */}
              {audience === 'specific' && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 8, padding: 10, borderBottom: '1px solid var(--border)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search" style={{ flex: 1, minWidth: 160 }}>
                      <Icon name="search" />
                      <input placeholder="Isim ara..." value={pickerQ} onChange={e => setPickerQ(e.target.value)} />
                    </div>
                    <select className="select" value={pickerGender} onChange={e => setPickerGender(e.target.value)}>
                      <option value="all">Hepsi</option>
                      <option value="F">Kizlar</option>
                      <option value="M">Erkekler</option>
                    </select>
                    <button className="btn btn--ghost btn--sm" onClick={selectAllVisible}>Tumunu sec</button>
                    <button className="btn btn--ghost btn--sm" onClick={clearSelection}>Temizle</button>
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {!usersLoaded && <div className="empty" style={{ padding: 24 }}>Yukleniyor...</div>}
                    {usersLoaded && pickerList.length === 0 && <div className="empty" style={{ padding: 24 }}>Kullanici yok</div>}
                    {pickerList.map(u => {
                      const on = selected.has(u.uid);
                      return (
                        <label key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: on ? 'var(--grad-soft)' : 'transparent', borderBottom: '1px solid var(--border)' }}>
                          <input type="checkbox" checked={on} onChange={() => toggleUser(u.uid)} style={{ width: 16, height: 16, accentColor: 'var(--purple)' }} />
                          <Avatar name={u.name} src={u.photoURL || (u.photos && u.photos[0])} online={u.online} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.city || '-'} · {u.age || '-'}</div>
                          </div>
                          <Badge variant={isFemale(u.gender) ? 'purple' : 'blue'}>{u.gender || '-'}</Badge>
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-3)', borderTop: '1px solid var(--border)' }}>
                    {selected.size} kullanici secildi
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gonderim sekli */}
          <div className="card">
            <div className="card__head"><div><div className="card__title">Gonderim Sekli</div><div className="card__sub">Push mu, uygulama ici mi?</div></div></div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    textAlign: 'left', padding: 12, borderRadius: 10,
                    background: mode === m.id ? 'var(--grad-soft)' : 'var(--bg-2)',
                    border: `1px solid ${mode === m.id ? 'rgba(168,85,247,0.4)' : 'var(--border)'}`,
                    color: 'var(--text)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${mode === m.id ? 'var(--purple)' : 'var(--border-strong)'}`, display: 'grid', placeItems: 'center' }}>
                    {mode === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)' }} />}
                  </div>
                  <Icon name={m.icon} size={16} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Icerik */}
          <div className="card">
            <div className="card__head"><div><div className="card__title">Icerik</div></div></div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Baslik" hint={`${title.length}/64`}>
                <input className="input" maxLength={64} value={title} onChange={e => setTitle(e.target.value)} placeholder="Orn: Yeni Premium Indirimi!" />
              </Field>
              <Field label="Mesaj" hint={`${message.length}/180`}>
                <textarea className="input" maxLength={180} rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Bildirim metni..." />
              </Field>
              <div className="row">
                <button className="btn btn--primary right" onClick={doSend} disabled={sending}>
                  {sending ? 'Gonderiyor...' : <><Icon name="send" /> Simdi gonder</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canli onizleme */}
        <div className="card" style={{ alignSelf: 'flex-start', position: 'sticky', top: 20 }}>
          <div className="card__head"><div><div className="card__title">Canli Onizleme</div><div className="card__sub">Telefonda nasil gorunur</div></div></div>
          <div className="card__body" style={{ display: 'grid', placeItems: 'center', padding: '28px 18px', gap: 18 }}>
            <div style={{
              width: 250, padding: 14,
              background: 'linear-gradient(180deg, #1e293b, #0f172a)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)', display: 'flex', gap: 10,
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--grad)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0, color: 'white' }}>E</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                  <span>ESLESBULUS</span><span>simdi</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3, color: 'white' }}>{title || 'Baslik onizlemesi'}</div>
                <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {message || 'Mesaj metni burada gorunecek...'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6 }}>
              <div><b style={{ color: 'var(--text-2)' }}>Hedef:</b> {AUDIENCES.find(a => a.id === audience)?.label}</div>
              <div><b style={{ color: 'var(--text-2)' }}>Sekil:</b> {MODES.find(m => m.id === mode)?.label}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.NotificationsPage = NotificationsPage;
