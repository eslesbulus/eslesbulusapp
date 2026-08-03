const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const [pData, sData] = await Promise.all([
        api('/purchases'),
        api('/purchases/stats'),
      ]);
      setPurchases(pData || []);
      setStats(sData || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => purchases.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (q && !p.name?.toLowerCase().includes(q.toLowerCase()) && !p.uid?.includes(q)) return false;
    return true;
  }), [purchases, typeFilter, q]);

  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const productLabel = (productId) => {
    if (!productId) return '-';
    if (productId.includes('100')) return '100 Jeton';
    if (productId.includes('500')) return '500 Jeton';
    if (productId.includes('1000') || productId.includes('1k')) return '1000 Jeton';
    if (productId.includes('weekly') || productId.includes('haftalik')) return 'Haftalik Premium';
    if (productId.includes('monthly') || productId.includes('aylik')) return 'Aylik Premium';
    if (productId.includes('yearly') || productId.includes('yillik')) return 'Yillik Premium';
    if (productId.includes('3month') || productId.includes('3ay')) return '3 Aylik Premium';
    return productId;
  };

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div>
          <h1>Satin Alimlar</h1>
          <p>Tum IAP islemleri &mdash; {filtered.length} kayit</p>
        </div>
        <button className="btn btn--ghost" onClick={load}><Icon name="refresh" /> Yenile</button>
      </div>

      {stats && (
        <div className="stats">
          <Stat icon="coin" label="Toplam Islem" value={fmtNum(stats.total || 0)} />
          <Stat icon="coin" label="Jeton Satisi" value={fmtNum(stats.coins || 0)} trend="up" trendValue={fmtNum(stats.totalCoinsAmount || 0) + ' jeton'} />
          <Stat icon="crown" label="Premium Satisi" value={fmtNum(stats.premium || 0)} trend="up" trendValue={fmtNum(stats.totalPremiumDays || 0) + ' gun'} />
        </div>
      )}

      <div className="card">
        <div className="filters">
          <div className="search">
            <Icon name="search" />
            <input placeholder="Isim veya UID ara..." value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
          </div>
          <select className="select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="all">Tur (Hepsi)</option>
            <option value="coins">Jeton</option>
            <option value="premium">Premium</option>
          </select>
          <button className="btn btn--ghost btn--sm" onClick={() => { setQ(''); setTypeFilter('all'); setPage(1); }}>
            <Icon name="close" size={13} /> Temizle
          </button>
        </div>

        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Kullanici</th>
                <th>Tur</th>
                <th>Urun</th>
                <th>Miktar</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={i}>
                  <td>
                    <div className="cell-user">
                      <Avatar name={p.name || '?'} src={p.photoURL} />
                      <div>
                        <div className="cell-user__name">{p.name || '?'}</div>
                        <div className="cell-user__id">{p.uid?.substring(0, 16)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {p.type === 'premium'
                      ? <Badge variant="purple"><Icon name="crown" size={11} /> Premium</Badge>
                      : <Badge variant="blue"><Icon name="coin" size={11} /> Jeton</Badge>
                    }
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{productLabel(p.productId)}</td>
                  <td className="mono">
                    {p.type === 'coins'
                      ? (p.amount || 0).toLocaleString('tr-TR') + ' jeton'
                      : (p.amount || 0) + ' gun'
                    }
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{fmtDate(p.date)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan="5" className="empty">Satin alim bulunamadi</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={totalPages} totalRows={filtered.length} onChange={setPage} />
      </div>
    </div>
  );
};

window.PurchasesPage = PurchasesPage;
