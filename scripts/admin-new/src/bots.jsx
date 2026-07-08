const BotsPage = () => {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [count, setCount] = useState(10);
  const [roleFilter, setRoleFilter] = useState('all');
  const [q, setQ] = useState('');
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadBots = async () => {
    setLoading(true);
    try {
      const data = await api('/fake-users?limit=200');
      setBots(data.users || data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { loadBots(); }, []);

  const list = bots.filter(b => {
    if (roleFilter !== 'all') {
      if (roleFilter === 'ai' && b.role !== 'fake-bot') return false;
      if (roleFilter === 'manual' && b.role !== 'fake-manual') return false;
    }
    if (q && !b.name?.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const generateBots = async () => {
    setGenerating(true);
    try {
      await api('/fake-users/generate', { method: 'POST', body: { count } });
      showToast(count + ' bot olusturuldu');
      setBulkOpen(false);
      loadBots();
    } catch (e) {
      showToast(e.message, 'error');
    }
    setGenerating(false);
  };

  const deleteBot = async (uid) => {
    if (!confirm('Bu botu silmek istediginize emin misiniz?')) return;
    try {
      await api('/fake-users/' + uid, { method: 'DELETE' });
      showToast('Bot silindi');
      loadBots();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const aiCount = bots.filter(b => b.role === 'fake-bot').length;
  const manualCount = bots.filter(b => b.role === 'fake-manual').length;

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div>
          <h1>Sahte Kullanicilar</h1>
          <p>Bot ve manuel test hesaplari — {bots.length} kayit</p>
        </div>
        <div className="row">
          <button className="btn btn--primary" onClick={() => setBulkOpen(true)}><Icon name="plus" /> Toplu Olustur</button>
        </div>
      </div>

      <div className="grid-3">
        <div className="card"><div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="stat__icon" style={{ marginBottom: 0 }}><Icon name="bot" /></div>
          <div><div className="stat__label">Toplam Bot</div><div className="stat__value">{bots.length}</div></div>
        </div></div>
        <div className="card"><div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="stat__icon" style={{ marginBottom: 0 }}><Icon name="aiBrain" /></div>
          <div><div className="stat__label">AI Botlar</div><div className="stat__value">{aiCount}</div></div>
        </div></div>
        <div className="card"><div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="stat__icon" style={{ marginBottom: 0 }}><Icon name="user" /></div>
          <div><div className="stat__label">Manuel Botlar</div><div className="stat__value">{manualCount}</div></div>
        </div></div>
      </div>

      <div className="card">
        <div className="filters">
          <div className="search">
            <Icon name="search" />
            <input placeholder="Bot ara..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">Rol (Hepsi)</option>
            <option value="ai">Bot AI</option>
            <option value="manual">Manuel</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Bot</th><th>Yas</th><th>Sehir</th><th>Cinsiyet</th><th>Rol</th><th>Durum</th><th style={{ width: 120 }}></th></tr>
            </thead>
            <tbody>
              {list.map(b => (
                <tr key={b.uid}>
                  <td>
                    <div className="cell-user">
                      <Avatar name={b.name} online={b.online} />
                      <div>
                        <div className="cell-user__name">{b.name}</div>
                        <div className="cell-user__id">{b.uid?.substring(0, 20)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{b.age || '-'}</td>
                  <td style={{ color: 'var(--text-2)' }}>{b.city || '-'}</td>
                  <td><Badge variant={b.gender === 'Kadin' || b.gender === 'Kadın' ? 'purple' : 'blue'}>{b.gender || '-'}</Badge></td>
                  <td>
                    {b.role === 'fake-bot'
                      ? <Badge variant="purple"><Icon name="aiBrain" size={11} /> Bot AI</Badge>
                      : <Badge variant="gray"><Icon name="user" size={11} /> Manuel</Badge>}
                  </td>
                  <td><Badge variant={b.online ? 'green' : 'gray'} dot={b.online ? 'online' : null}>{b.online ? 'Aktif' : 'Pasif'}</Badge></td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn" title="Sil" onClick={() => deleteBot(b.uid)}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan="7" className="empty">Bot bulunamadi</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Toplu Bot Olustur"
        sub="Belirtilen sayida rastgele profilli bot hesabi uretir."
        foot={<>
          <button className="btn btn--ghost" onClick={() => setBulkOpen(false)}>Iptal</button>
          <button className="btn btn--primary" onClick={generateBots} disabled={generating}>
            {generating ? 'Olusturuluyor...' : <><Icon name="plus" /> {count} bot olustur</>}
          </button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Olusturulacak bot sayisi" hint="Aralik: 1 — 200">
            <input className="input mono" type="number" min="1" max="200" value={count} onChange={e => setCount(Number(e.target.value))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
};

window.BotsPage = BotsPage;
