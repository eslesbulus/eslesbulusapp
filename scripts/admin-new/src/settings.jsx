const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [maintenanceEnd, setMaintenanceEnd] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const [likes, setLikes] = useState(10);
  const [hellos, setHellos] = useState(5);
  const [storyLikes, setStoryLikes] = useState(20);

  const [msgCost, setMsgCost] = useState(0);
  const [premiumMonthly, setPremiumMonthly] = useState(99.99);
  const [premiumYearly, setPremiumYearly] = useState(599.99);
  const [welcomeTokens, setWelcomeTokens] = useState(100);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const s = await api('/settings');
      setMaintenance(s.maintenanceMode || false);
      setMaintenanceMsg(s.maintenanceMessage || '');
      if (s.maintenanceEndDate) {
        const d = new Date(s.maintenanceEndDate);
        setMaintenanceEnd(d.toISOString().slice(0, 16));
      }
      setAnnouncement(s.announcementText || '');
      setLikes(s.dailyLikeLimit || 10);
      setHellos(s.dailyHiLimit || 5);
      setStoryLikes(s.dailyStoryLikeLimit || 20);
      setMsgCost(s.messageTokenCost || 0);
      setPremiumMonthly(s.premiumMonthlyPrice || 99.99);
      setPremiumYearly(s.premiumYearlyPrice || 599.99);
      setWelcomeTokens(s.defaultTokens || 100);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { loadSettings(); }, []);

  const saveAll = async () => {
    setSaving(true);
    try {
      await api('/settings', {
        method: 'PATCH',
        body: {
          maintenanceMode: maintenance,
          maintenanceMessage: maintenanceMsg,
          maintenanceEndDate: maintenanceEnd ? new Date(maintenanceEnd).toISOString() : null,
          announcementText: announcement,
          dailyLikeLimit: likes,
          dailyHiLimit: hellos,
          dailyStoryLikeLimit: storyLikes,
          messageTokenCost: msgCost,
          premiumMonthlyPrice: premiumMonthly,
          premiumYearlyPrice: premiumYearly,
          defaultTokens: welcomeTokens,
        },
      });
      showToast('Ayarlar kaydedildi');
    } catch (e) {
      showToast(e.message, 'error');
    }
    setSaving(false);
  };

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div>
          <h1>Genel Ayarlar</h1>
          <p>Uygulama parametreleri ve sistem kontrolleri</p>
        </div>
        <div className="row">
          <button className="btn btn--ghost" onClick={loadSettings}>Iptal</button>
          <button className="btn btn--primary" onClick={saveAll} disabled={saving}>
            {saving ? 'Kaydediliyor...' : <><Icon name="check" /> Tumunu kaydet</>}
          </button>
        </div>
      </div>

      {/* Maintenance */}
      <div className="card">
        <div className="card__head"><div><div className="card__title">Bakim Modu</div><div className="card__sub">Tum kullanicilar icin uygulamayi gecici kapatir</div></div></div>
        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ToggleRow
            lg
            label={maintenance ? 'Bakim modu ACIK — uygulama kullanilamiyor' : 'Bakim modu kapali'}
            sub={maintenance ? 'Yeni oturumlar engelleniyor.' : 'Tum hizmetler normal calisiyor.'}
            on={maintenance}
            onChange={setMaintenance}
          />
          <div className="grid-2-1">
            <Field label="Bakim mesaji" hint="Tam ekranda gosterilir">
              <textarea className="input" rows={3} value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)} disabled={!maintenance} />
            </Field>
            <Field label="Bitis tarihi / saati" hint="Bu zamanda otomatik kalkar">
              <input className="input" type="datetime-local" value={maintenanceEnd} onChange={e => setMaintenanceEnd(e.target.value)} disabled={!maintenance} />
            </Field>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Daily limits */}
        <div className="card">
          <div className="card__head"><div><div className="card__title">Gunluk Limitler</div><div className="card__sub">Normal kullanicilar icin gunluk aksiyon siniri</div></div></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Begeni limiti">
              <Slider value={likes} min={1} max={500} onChange={setLikes} format={v => `${v} / gun`} />
            </Field>
            <Field label="Merhaba mesaji limiti">
              <Slider value={hellos} min={1} max={100} onChange={setHellos} format={v => `${v} / gun`} />
            </Field>
            <Field label="Hikaye begeni limiti">
              <Slider value={storyLikes} min={1} max={1000} step={5} onChange={setStoryLikes} format={v => `${v} / gun`} />
            </Field>
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <div className="card__head"><div><div className="card__title">Ucretlendirme</div><div className="card__sub">Jeton ve premium fiyatlari</div></div></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Mesaj basi jeton ucreti">
              <div style={{ position: 'relative' }}>
                <input className="input mono" type="number" value={msgCost} onChange={e => setMsgCost(Number(e.target.value))} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 12 }}>jeton</span>
              </div>
            </Field>
            <div className="grid-2">
              <Field label="Premium / aylik">
                <div style={{ position: 'relative' }}>
                  <input className="input mono" type="number" step="0.01" value={premiumMonthly} onChange={e => setPremiumMonthly(Number(e.target.value))} />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 12 }}>TL</span>
                </div>
              </Field>
              <Field label="Premium / yillik">
                <div style={{ position: 'relative' }}>
                  <input className="input mono" type="number" step="0.01" value={premiumYearly} onChange={e => setPremiumYearly(Number(e.target.value))} />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 12 }}>TL</span>
                </div>
              </Field>
            </div>
            <Field label="Hosgeldin jeton miktari" hint="Yeni kayitlara otomatik verilir">
              <div style={{ position: 'relative' }}>
                <input className="input mono" type="number" value={welcomeTokens} onChange={e => setWelcomeTokens(Number(e.target.value))} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 12 }}>jeton</span>
              </div>
            </Field>
          </div>
        </div>
      </div>

      {/* Announcement */}
      <div className="card">
        <div className="card__head"><div><div className="card__title">Duyuru Metni</div><div className="card__sub">Uygulama ana sayfasinda banner olarak gosterilir</div></div></div>
        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea className="input" rows={3} value={announcement} onChange={e => setAnnouncement(e.target.value)} />
          {announcement && (
            <div style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--grad-soft)', borderRadius: 10, border: '1px solid rgba(168,85,247,0.25)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--grad)', display: 'grid', placeItems: 'center' }}>
                <Icon name="bell" size={16} />
              </div>
              <div style={{ flex: 1, fontSize: 13, color: '#f3e8ff' }}>{announcement}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.SettingsPage = SettingsPage;
