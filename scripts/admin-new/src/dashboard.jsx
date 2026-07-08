const DashboardPage = () => {
  const { data, loading, error, reload } = useApi('/dashboard');

  if (loading) return <div className="page fade-in"><Loader /></div>;
  if (error) return <div className="page fade-in"><ErrorBox msg={error} onRetry={reload} /></div>;

  const d = data || {};
  const stats = [
    { icon: 'users',  label: 'Toplam Kullanici',  value: fmtNum(d.totalUsers || 0),    trend: 'up', trendValue: '+' + (d.totalUsers || 0) },
    { icon: 'zap',    label: 'Aktif (Online)',     value: fmtNum(d.onlineUsers || 0),    trend: 'up', trendValue: fmtNum(d.onlineUsers || 0) },
    { icon: 'plus',   label: 'Bugunku Kayit',      value: fmtNum(d.todayRegistrations || 0), trend: 'up', trendValue: '+' + (d.todayRegistrations || 0) },
    { icon: 'posts',  label: 'Toplam Gonderi',     value: fmtNum(d.totalPosts || 0),     trend: 'up', trendValue: fmtNum(d.totalPosts || 0) },
    { icon: 'chat',   label: 'Toplam Sohbet',      value: fmtNum(d.totalChats || 0),     trend: 'up', trendValue: fmtNum(d.totalChats || 0) },
    { icon: 'story',  label: 'Toplam Hikaye',      value: fmtNum(d.totalStories || 0),   trend: 'up', trendValue: fmtNum(d.totalStories || 0) },
  ];

  // Gender distribution for donut
  const genderData = [
    { l: 'Kadin',      v: d.genderFemale || 0,  color: '#ec4899' },
    { l: 'Erkek',      v: d.genderMale || 0,    color: '#a855f7' },
    { l: 'Diger',      v: d.genderOther || 0,   color: '#64748b' },
  ].filter(g => g.v > 0);

  // Registration trend (use last 7 days if available)
  const regTrend = (d.registrationTrend || []).map(r => ({ l: r.label || r.date || '', v: r.count || r.value || 0 }));
  const dayLabels = ['Paz', 'Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt'];
  const defaultTrend = regTrend.length > 0 ? regTrend : dayLabels.map(l => ({ l, v: 0 }));

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div>
          <h1>Dashboard</h1>
          <p>Genel bakis &middot; Bugunku ozet metrikler ve son aktiviteler</p>
        </div>
        <div className="row">
          <button className="btn btn--primary" onClick={reload}><Icon name="refresh" /> Yenile</button>
        </div>
      </div>

      <div className="stats">
        {stats.map((s, i) => <Stat key={i} {...s} />)}
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Son 7 Gun Kayit Trendi</div>
              <div className="card__sub">Gunluk yeni kullanici sayisi</div>
            </div>
            <div className="chart-legend">
              <div className="chart-legend__item">
                <span className="chart-legend__swatch" style={{ background: 'linear-gradient(90deg, #a855f7, #ec4899)' }} />
                Yeni Kayit
              </div>
            </div>
          </div>
          <div className="card__body">
            {defaultTrend.length > 1 ? <LineChart data={defaultTrend} height={220} /> : <div className="empty">Veri yok</div>}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Cinsiyet Dagilimi</div>
              <div className="card__sub">Tum aktif hesaplar</div>
            </div>
          </div>
          <div className="card__body" style={{ display: 'grid', placeItems: 'center', gap: 16 }}>
            {genderData.length > 0 ? (
              <>
                <Donut data={genderData} size={200} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  {genderData.map((g, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <span className="chart-legend__swatch" style={{ background: g.color, width: 12, height: 12 }} />
                      <span style={{ flex: 1 }}>{g.l}</span>
                      <span className="mono" style={{ color: 'var(--text-2)' }}>{g.v.toLocaleString('tr-TR')}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="empty">Veri yok</div>}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid-2-1">
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Hizli Bakis</div>
              <div className="card__sub">Onemli sistem metrikleri</div>
            </div>
          </div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Premium kullanici', value: fmtNum(d.premiumUsers || 0), color: '#a855f7' },
              { label: 'Toplam sohbet', value: fmtNum(d.totalChats || 0), color: '#ec4899' },
              { label: 'Toplam hikaye', value: fmtNum(d.totalStories || 0), color: '#10b981' },
              { label: 'Sahte kullanici', value: fmtNum(d.fakeUsers || 0), color: '#f97316' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.label}</div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{r.value}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: r.color }} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Sistem</div>
              <div className="card__sub">Sunucu durumu</div>
            </div>
          </div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>API</span>
              <Badge variant="green" dot="online">Calisiyor</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>Veritabani</span>
              <Badge variant="green" dot="online">Calisiyor</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>Bot AI</span>
              <Badge variant={d.botEnabled ? 'green' : 'gray'}>{d.botEnabled ? 'Aktif' : 'Devre disi'}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>Bakim modu</span>
              <Badge variant={d.maintenanceMode ? 'orange' : 'green'}>{d.maintenanceMode ? 'ACIK' : 'Kapali'}</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.DashboardPage = DashboardPage;
