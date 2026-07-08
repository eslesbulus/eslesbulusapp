/* ---- Posts ---- */
const PostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api('/posts?limit=100');
      setPosts(d.posts || d || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const deletePost = async (id) => {
    if (!confirm('Bu gonderiyi silmek istediginize emin misiniz?')) return;
    try {
      await api('/posts/' + id, { method: 'DELETE' });
      showToast('Gonderi silindi');
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div><h1>Gonderiler</h1><p>Kullanici paylasimlari &mdash; {posts.length} gonderi</p></div>
        <button className="btn btn--ghost" onClick={load}><Icon name="refresh" /> Yenile</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Kullanici</th><th>Icerik</th><th>Begeni</th><th>Tarih</th><th></th></tr></thead>
            <tbody>
              {posts.map(p => (
                <tr key={p._id}>
                  <td>
                    <div className="cell-user">
                      <Avatar name={p.userName || p.user?.name || '?'} />
                      <div><div className="cell-user__name">{p.userName || p.user?.name || '?'}</div></div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption || p.text || '-'}</td>
                  <td className="mono">{p.likes?.length || p.likeCount || 0}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{fmtDate(p.createdAt)}</td>
                  <td><div className="actions"><button className="icon-btn" title="Sil" onClick={() => deletePost(p._id)}><Icon name="trash" /></button></div></td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan="5" className="empty">Gonderi yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ---- Chats ---- */
const ChatsPage = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api('/chats?limit=100');
      setChats(d.chats || d || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div><h1>Sohbetler</h1><p>Aktif konusmalari izle &mdash; {chats.length} sohbet</p></div>
        <button className="btn btn--ghost" onClick={load}><Icon name="refresh" /> Yenile</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Katilimcilar</th><th>Son Mesaj</th><th>Mesaj Sayisi</th><th>Son Aktivite</th></tr></thead>
            <tbody>
              {chats.map(c => (
                <tr key={c._id || c.chatKey}>
                  <td>
                    <div className="cell-user" style={{ gap: 14 }}>
                      <div style={{ display: 'flex' }}>
                        <Avatar name={c.participantNames?.[0] || c.participants?.[0] || '?'} />
                        <div style={{ marginLeft: -10, border: '2px solid var(--card)', borderRadius: '50%' }}><Avatar name={c.participantNames?.[1] || c.participants?.[1] || '?'} /></div>
                      </div>
                      <div>
                        <div className="cell-user__name">{(c.participantNames || c.participants || []).join(' <> ')}</div>
                        <div className="cell-user__id">{c.chatKey || c._id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage || '-'}</td>
                  <td className="mono">{c.messageCount || c.messages?.length || 0}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{timeAgo(c.lastMessageAt)}</td>
                </tr>
              ))}
              {chats.length === 0 && <tr><td colSpan="4" className="empty">Sohbet yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ---- Stories ---- */
const StoriesPage = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api('/stories?limit=100');
      setStories(d.stories || d || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const deleteStory = async (id) => {
    if (!confirm('Bu hikayeyi silmek istediginize emin misiniz?')) return;
    try {
      await api('/stories/' + id, { method: 'DELETE' });
      showToast('Hikaye silindi');
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div><h1>Hikayeler</h1><p>Yayinda olan hikayeler &mdash; {stories.length} hikaye</p></div>
        <button className="btn btn--ghost" onClick={load}><Icon name="refresh" /> Yenile</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Kullanici</th><th>Goruntulenme</th><th>Tarih</th><th></th></tr></thead>
            <tbody>
              {stories.map(s => (
                <tr key={s._id}>
                  <td>
                    <div className="cell-user">
                      <Avatar name={s.userName || s.user?.name || '?'} />
                      <div><div className="cell-user__name">{s.userName || s.user?.name || '?'}</div></div>
                    </div>
                  </td>
                  <td className="mono">{s.views?.length || s.viewCount || 0}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{fmtDate(s.createdAt)}</td>
                  <td><div className="actions"><button className="icon-btn" title="Sil" onClick={() => deleteStory(s._id)}><Icon name="trash" /></button></div></td>
                </tr>
              ))}
              {stories.length === 0 && <tr><td colSpan="4" className="empty">Hikaye yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ---- Reports ---- */
const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const d = await api('/reports?limit=200');
      setReports(d.reports || d || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api('/reports/' + id, { method: 'PATCH', body: { status } });
      showToast('Rapor guncellendi');
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const list = tab === 'all' ? reports : reports.filter(r => r.status === tab);
  const tabs = [
    { id: 'all',       label: 'Hepsi',       n: reports.length },
    { id: 'open',      label: 'Yeni',        n: reports.filter(r => r.status === 'open').length },
    { id: 'reviewing', label: 'Inceleniyor', n: reports.filter(r => r.status === 'reviewing').length },
    { id: 'resolved',  label: 'Cozuldu',     n: reports.filter(r => r.status === 'resolved').length },
  ];

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div><h1>Raporlar & Sikayetler</h1><p>{reports.length} rapor</p></div>
        <button className="btn btn--ghost" onClick={load}><Icon name="refresh" /> Yenile</button>
      </div>

      <div className="card">
        <div className="filters" style={{ gap: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="btn btn--sm" style={{
              background: tab === t.id ? 'var(--grad-soft)' : 'transparent',
              borderColor: tab === t.id ? 'rgba(168,85,247,0.4)' : 'var(--border)',
              color: tab === t.id ? 'white' : 'var(--text-2)',
            }}>
              {t.label} <span style={{ opacity: 0.7, fontWeight: 500 }}>{t.n}</span>
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>ID</th><th>Hedef</th><th>Sebep</th><th>Bildiren</th><th>Durum</th><th>Zaman</th><th></th></tr></thead>
            <tbody>
              {list.map(r => (
                <tr key={r._id}>
                  <td className="mono" style={{ color: 'var(--text-2)' }}>{(r._id || '').substring(0, 8)}</td>
                  <td><strong>{r.targetName || r.targetUid || '-'}</strong></td>
                  <td style={{ color: 'var(--text-2)' }}>{r.reason || '-'}</td>
                  <td style={{ color: 'var(--text-2)' }}>{r.reporterName || r.reporterUid || '-'}</td>
                  <td>
                    <Badge variant={r.status === 'open' ? 'orange' : r.status === 'reviewing' ? 'blue' : 'green'}>
                      {r.status === 'open' ? 'Yeni' : r.status === 'reviewing' ? 'Inceleniyor' : 'Cozuldu'}
                    </Badge>
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{timeAgo(r.createdAt)}</td>
                  <td>
                    <div className="actions">
                      {r.status === 'open' && <button className="icon-btn" title="Incele" onClick={() => updateStatus(r._id, 'reviewing')}><Icon name="eye" /></button>}
                      {r.status !== 'resolved' && <button className="icon-btn" title="Coz" onClick={() => updateStatus(r._id, 'resolved')}><Icon name="check" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan="7" className="empty">Rapor yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ---- Gifts ---- */
const GiftsPage = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api('/gifts');
      setGifts(d.gifts || d || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div><h1>Hediyeler</h1><p>Sanal hediye katalogu</p></div>
        <button className="btn btn--ghost" onClick={load}><Icon name="refresh" /> Yenile</button>
      </div>
      <div className="card">
        <div className="card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {gifts.map(g => (
            <div key={g._id || g.name} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>{g.emoji || g.icon || '🎁'}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 4, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {g.price || g.tokenCost || 0} <span style={{ fontSize: 11, color: 'var(--text-3)', WebkitTextFillColor: 'var(--text-3)' }}>jeton</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
                {(g.totalSent || 0).toLocaleString('tr-TR')} gonderim
              </div>
            </div>
          ))}
          {gifts.length === 0 && <div className="empty" style={{ gridColumn: '1/-1' }}>Hediye tanimlanmamis</div>}
        </div>
      </div>
    </div>
  );
};

/* ---- Analytics ---- */
const AnalyticsPage = () => {
  const { data, loading, error, reload } = useApi('/analytics');

  if (loading) return <div className="page fade-in"><Loader /></div>;
  if (error) return <div className="page fade-in"><ErrorBox msg={error} onRetry={reload} /></div>;

  const d = data || {};

  // Registration trend
  const regTrend = (d.registrationTrend || []).map(r => ({ l: r.label || r.date || '', v: r.count || 0 }));

  // City distribution
  const cities = (d.cityDistribution || []).slice(0, 8);
  const maxCity = Math.max(...cities.map(c => c.count || 0), 1);

  // Gender dist
  const genders = d.genderDistribution || [];

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div><h1>Analitik</h1><p>Derinlemesine kullanici metrikleri</p></div>
        <button className="btn btn--ghost" onClick={reload}><Icon name="refresh" /> Yenile</button>
      </div>

      {regTrend.length > 1 && (
        <div className="card">
          <div className="card__head"><div><div className="card__title">Kayit Trendi</div><div className="card__sub">Son donem</div></div></div>
          <div className="card__body"><LineChart data={regTrend} height={240} /></div>
        </div>
      )}

      <div className="grid-2">
        {cities.length > 0 && (
          <div className="card">
            <div className="card__head"><div><div className="card__title">Sehir Bazli Dagilim</div></div></div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cities.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ minWidth: 80, fontSize: 13 }}>{c.city || c._id || '-'}</div>
                  <div style={{ flex: 1, height: 8, background: 'var(--bg-2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${((c.count || 0) / maxCity) * 100}%`, height: '100%', background: 'var(--grad)', borderRadius: 4 }} />
                  </div>
                  <div className="mono" style={{ minWidth: 50, textAlign: 'right', fontSize: 12 }}>{(c.count || 0).toLocaleString('tr-TR')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {genders.length > 0 && (
          <div className="card">
            <div className="card__head"><div><div className="card__title">Cinsiyet Dagilimi</div></div></div>
            <div className="card__body" style={{ display: 'grid', placeItems: 'center', gap: 12 }}>
              <Donut data={genders.map(g => ({
                l: g.gender || g._id || 'Diger',
                v: g.count || 0,
                color: (g.gender || g._id) === 'Erkek' ? '#a855f7' : (g.gender || g._id) === 'Kadin' || (g.gender || g._id) === 'Kadın' ? '#ec4899' : '#64748b',
              }))} size={180} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                {genders.map((g, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>{g.gender || g._id || 'Diger'}</span>
                    <span className="mono" style={{ color: 'var(--text-2)' }}>{(g.count || 0).toLocaleString('tr-TR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---- Health ---- */
const HealthPage = () => {
  const services = [
    { name: 'API Gateway',    status: 'up', latency: '-',   uptime: '-' },
    { name: 'MongoDB',        status: 'up', latency: '-',   uptime: '-' },
    { name: 'Redis',          status: 'up', latency: '-',   uptime: '-' },
    { name: 'Socket.IO',      status: 'up', latency: '-',   uptime: '-' },
    { name: 'Firebase Auth',  status: 'up', latency: '-',   uptime: '-' },
    { name: 'Bot AI Worker',  status: 'up', latency: '-',   uptime: '-' },
  ];

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div><h1>Sistem Sagligi</h1><p>Servislerin durumu</p></div>
        <Badge variant="green" dot="online">Sistemler calisiyor</Badge>
      </div>

      <div className="card">
        <div className="card__head"><div><div className="card__title">Servisler</div></div></div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Servis</th><th>Durum</th><th>Gecikme</th><th>Uptime</th></tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.name}>
                  <td><strong>{s.name}</strong></td>
                  <td>
                    {s.status === 'up'      && <Badge variant="green" dot="online">Calisiyor</Badge>}
                    {s.status === 'degraded' && <Badge variant="orange">Yavas</Badge>}
                    {s.status === 'down'     && <Badge variant="red">Cevrimdisi</Badge>}
                  </td>
                  <td className="mono">{s.latency}</td>
                  <td className="mono">{s.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { PostsPage, ChatsPage, StoriesPage, ReportsPage, GiftsPage, AnalyticsPage, HealthPage });
