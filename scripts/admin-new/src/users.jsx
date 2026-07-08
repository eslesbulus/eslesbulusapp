const UsersPage = () => {
  const [q, setQ] = useState('');
  const [gender, setGender] = useState('all');
  const [status, setStatus] = useState('all');
  const [tier, setTier] = useState('all');
  const [presence, setPresence] = useState('all');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api('/users?limit=500');
      setAllUsers(data.users || data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { loadUsers(); }, []);

  const filtered = useMemo(() => allUsers.filter(u => {
    if (u.role === 'fake-bot' || u.role === 'fake-manual') return false;
    if (q && !u.name?.toLowerCase().includes(q.toLowerCase()) && !u.uid?.includes(q.toLowerCase())) return false;
    if (gender !== 'all') {
      const g = gender === 'F' ? 'Kadin' : 'Erkek';
      if (u.gender !== g && u.gender !== (gender === 'F' ? 'Kadın' : 'Erkek')) return false;
    }
    if (status !== 'all') {
      if (status === 'banned' && !u.banned) return false;
      if (status === 'suspended' && !u.suspended) return false;
      if (status === 'active' && (u.banned || u.suspended)) return false;
    }
    if (tier === 'premium' && !u.isPremium) return false;
    if (tier === 'normal' && u.isPremium) return false;
    if (presence === 'online' && !u.online) return false;
    if (presence === 'offline' && u.online) return false;
    return true;
  }), [allUsers, q, gender, status, tier, presence]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div>
          <h1>Kullanicilar</h1>
          <p>{filtered.length.toLocaleString('tr-TR')} kullanici listeleniyor</p>
        </div>
        <div className="row">
          <button className="btn btn--ghost" onClick={loadUsers}><Icon name="refresh" /> Yenile</button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div className="search">
            <Icon name="search" />
            <input placeholder="Isim, UID ara..." value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
          </div>
          <select className="select" value={gender} onChange={e => { setGender(e.target.value); setPage(1); }}>
            <option value="all">Cinsiyet (Hepsi)</option>
            <option value="F">Kadin</option>
            <option value="M">Erkek</option>
          </select>
          <select className="select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">Durum (Hepsi)</option>
            <option value="active">Aktif</option>
            <option value="suspended">Askida</option>
            <option value="banned">Banli</option>
          </select>
          <select className="select" value={tier} onChange={e => { setTier(e.target.value); setPage(1); }}>
            <option value="all">Uyelik (Hepsi)</option>
            <option value="premium">Premium</option>
            <option value="normal">Normal</option>
          </select>
          <select className="select" value={presence} onChange={e => { setPresence(e.target.value); setPage(1); }}>
            <option value="all">Cevrimici (Hepsi)</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          <button className="btn btn--ghost btn--sm" onClick={() => { setQ(''); setGender('all'); setStatus('all'); setTier('all'); setPresence('all'); setPage(1); }}>
            <Icon name="close" size={13} /> Temizle
          </button>
        </div>

        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Kullanici</th>
                <th>Yas</th>
                <th>Sehir</th>
                <th>Cinsiyet</th>
                <th>Durum</th>
                <th>Uyelik</th>
                <th>Jeton</th>
                <th>Kayit</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(u => {
                const isBanned = u.banned;
                const isSuspended = u.suspended;
                const statusLabel = isBanned ? 'banned' : isSuspended ? 'suspended' : 'active';
                return (
                  <tr key={u.uid} onClick={() => setActive(u)} className={active?.uid === u.uid ? 'is-active' : ''}>
                    <td>
                      <div className="cell-user">
                        <Avatar name={u.name} online={u.online} src={u.photoURL || (u.photos && u.photos[0])} />
                        <div>
                          <div className="cell-user__name">
                            {u.name}
                            {u.verified && <span style={{ marginLeft: 6, color: '#3b82f6' }} title="Dogrulanmis"><Icon name="shield" size={13} /></span>}
                          </div>
                          <div className="cell-user__id">{u.uid?.substring(0, 16)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{u.age || '-'}</td>
                    <td style={{ color: 'var(--text-2)' }}>{u.city || '-'}</td>
                    <td>
                      <Badge variant={u.gender === 'Kadin' || u.gender === 'Kadın' ? 'purple' : 'blue'}>
                        {u.gender || '-'}
                      </Badge>
                    </td>
                    <td>
                      {statusLabel === 'active'    && <Badge variant="green" dot="online">Aktif</Badge>}
                      {statusLabel === 'suspended' && <Badge variant="orange">Askida</Badge>}
                      {statusLabel === 'banned'    && <Badge variant="red">Banli</Badge>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {u.isPremium && <Badge variant="purple"><Icon name="crown" size={11} /> Premium</Badge>}
                        {u.vip && <Badge variant="blue"><Icon name="star" size={11} /> VIP</Badge>}
                        {!u.isPremium && !u.vip && <Badge variant="gray">Normal</Badge>}
                      </div>
                    </td>
                    <td className="mono">{(u.tokens || 0).toLocaleString('tr-TR')}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{fmtDate(u.createdAt)}</td>
                    <td>
                      <div className="actions" onClick={e => e.stopPropagation()}>
                        <button className="icon-btn" title="Detay" onClick={() => setActive(u)}><Icon name="eye" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan="9" className="empty">Filtreye uyan kullanici bulunamadi</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={totalPages} totalRows={filtered.length} onChange={setPage} />
      </div>

      <UserDrawer user={active} onClose={() => setActive(null)} onSaved={loadUsers} />
    </div>
  );
};

const UserDrawer = ({ user, onClose, onSaved }) => {
  const [tokens, setTokens] = useState(0);
  const [premiumDays, setPremiumDays] = useState(30);
  const [verified, setVerified] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setTokens(user.tokens || 0);
      setVerified(user.verified || false);
      setIsVip(user.vip || false);
    }
  }, [user?.uid]);

  const saveUser = async (updates) => {
    if (!user) return;
    setSaving(true);
    try {
      await api('/users/' + user.uid, { method: 'PATCH', body: updates });
      showToast('Kullanici guncellendi');
      onSaved && onSaved();
    } catch (e) {
      showToast(e.message, 'error');
    }
    setSaving(false);
  };

  if (!user) return <Drawer open={false} onClose={onClose} title="" />;

  const isBanned = user.banned;
  const isSuspended = user.suspended;

  return (
    <Drawer
      open={!!user}
      onClose={onClose}
      title="Kullanici Detayi"
      foot={<><button className="btn btn--ghost" onClick={onClose}>Kapat</button><button className="btn btn--primary" disabled={saving} onClick={() => saveUser({ tokens, verified, vip: isVip })}><Icon name="check" /> Kaydet</button></>}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
        <Avatar name={user.name} online={user.online} size="xl" src={user.photoURL || (user.photos && user.photos[0])} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{user.uid}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {!isBanned && !isSuspended && <Badge variant="green" dot="online">Aktif</Badge>}
            {isSuspended && <Badge variant="orange">Askida</Badge>}
            {isBanned && <Badge variant="red">Banli</Badge>}
            {user.isPremium && <Badge variant="purple"><Icon name="crown" size={11}/> Premium</Badge>}
            {isVip && <Badge variant="blue"><Icon name="star" size={11}/> VIP</Badge>}
            {verified && <Badge variant="blue"><Icon name="shield" size={11}/> Dogrulandi</Badge>}
          </div>
        </div>
      </div>

      {user.photos && user.photos.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {user.photos.map((p, i) => (
            <img key={i} src={p} style={{ width: 76, height: 100, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__body">
          <div className="kvs">
            <div><div className="kv__k">Yas</div><div className="kv__v">{user.age || '-'}</div></div>
            <div><div className="kv__k">Sehir</div><div className="kv__v">{user.city || '-'}</div></div>
            <div><div className="kv__k">Cinsiyet</div><div className="kv__v">{user.gender || '-'}</div></div>
            <div><div className="kv__k">Kayit</div><div className="kv__v">{fmtDate(user.createdAt)}</div></div>
            <div><div className="kv__k">Son aktivite</div><div className="kv__v">{user.online ? 'simdi' : timeAgo(user.lastActive)}</div></div>
            <div><div className="kv__k">Toplam jeton</div><div className="kv__v mono">{tokens.toLocaleString('tr-TR')}</div></div>
          </div>
          {user.bio && <><hr className="hr" /><div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Biyo</div><div style={{ fontSize: 13.5 }}>{user.bio}</div></>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__head"><div><div className="card__title">Jeton Ayarla</div><div className="card__sub">Kullanici bakiyesini guncelle</div></div></div>
        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="row gap-6">
            <button className="btn btn--ghost btn--sm" onClick={() => setTokens(t => Math.max(0, t - 100))}>-100</button>
            <button className="btn btn--ghost btn--sm" onClick={() => setTokens(t => Math.max(0, t - 10))}>-10</button>
            <input className="input mono" style={{ textAlign: 'center', maxWidth: 120 }} value={tokens} onChange={e => setTokens(Number(e.target.value) || 0)} />
            <button className="btn btn--ghost btn--sm" onClick={() => setTokens(t => t + 10)}>+10</button>
            <button className="btn btn--ghost btn--sm" onClick={() => setTokens(t => t + 100)}>+100</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__head"><div><div className="card__title">Premium Suresi</div><div className="card__sub">Hediye veya manuel atama</div></div></div>
        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="row gap-6">
            {[7, 30, 90, 365].map(d => (
              <button key={d} className="btn btn--ghost btn--sm" onClick={() => setPremiumDays(d)} style={premiumDays === d ? { background: 'var(--grad-soft)', borderColor: 'rgba(168,85,247,0.4)', color: 'white' } : null}>
                {d} gun
              </button>
            ))}
          </div>
          <Slider value={premiumDays} min={1} max={365} onChange={setPremiumDays} format={v => `${v} gun`} />
          <button className="btn btn--primary" disabled={saving} onClick={() => saveUser({ isPremium: true, premiumDays })}><Icon name="crown" size={13} /> Premium ver — {premiumDays} gun</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <ToggleRow label="Dogrulanmis (Verified)" sub="Mavi rozet gorunur" on={verified} onChange={setVerified} />
        <ToggleRow label="VIP Uye" sub="Ozel ayricaliklar" on={isVip} onChange={setIsVip} />
      </div>

      <div className="card">
        <div className="card__head"><div><div className="card__title">Hesap Aksiyonlari</div><div className="card__sub">Dikkatli kullan</div></div></div>
        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isBanned ? (
            <button className="btn btn--success" onClick={() => saveUser({ banned: false })}><Icon name="check" /> Bani kaldir</button>
          ) : (
            <button className="btn btn--danger" onClick={() => saveUser({ banned: true })}><Icon name="ban" /> Hesabi banla</button>
          )}
          {isSuspended ? (
            <button className="btn btn--success" onClick={() => saveUser({ suspended: false })}><Icon name="refresh" /> Askiyi kaldir</button>
          ) : (
            <button className="btn btn--warn" onClick={() => saveUser({ suspended: true })}><Icon name="pause" /> Gecici askiya al</button>
          )}
        </div>
      </div>
    </Drawer>
  );
};

window.UsersPage = UsersPage;
