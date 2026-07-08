const BotAIPage = () => {
  const [enabled, setEnabled] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [minDelay, setMinDelay] = useState(1000);
  const [maxDelay, setMaxDelay] = useState(3000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Test panel
  const [testMsg, setTestMsg] = useState('');
  const [convo, setConvo] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [botName, setBotName] = useState('Cansu');
  const [botAge, setBotAge] = useState('24');
  const [botCity, setBotCity] = useState('Istanbul');
  const chatRef = useRef(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api('/settings');
      setEnabled(data.botEnabled || false);
      setApiUrl(data.botApiUrl || '');
      setApiKey(data.botApiKey || '');
      setMinDelay(data.botResponseDelayMin || 1000);
      setMaxDelay(data.botResponseDelayMax || 3000);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { loadSettings(); }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [convo, thinking]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api('/settings', {
        method: 'PATCH',
        body: { botEnabled: enabled, botApiUrl: apiUrl, botApiKey: apiKey, botResponseDelayMin: minDelay, botResponseDelayMax: maxDelay },
      });
      showToast('Bot ayarlari kaydedildi');
    } catch (e) {
      showToast(e.message, 'error');
    }
    setSaving(false);
  };

  const send = async () => {
    if (!testMsg.trim() || thinking) return;
    const msg = testMsg;
    setConvo(c => [...c, { role: 'user', text: msg, time: new Date() }]);
    setTestMsg('');
    setThinking(true);

    try {
      const res = await api('/bot-test', {
        method: 'POST',
        body: {
          message: msg,
          botName: botName,
          botAge: botAge,
          botCity: botCity,
          userName: 'Test Admin',
          dialog: 'admin-test-' + Date.now(),
        },
      });

      if (res.response) {
        setConvo(c => [...c, { role: 'bot', text: res.response, time: new Date(), latency: res.latency }]);
      } else {
        setConvo(c => [...c, { role: 'error', text: res.error || 'Yanit alinamadi', time: new Date() }]);
      }
    } catch (e) {
      setConvo(c => [...c, { role: 'error', text: e.message || 'API hatasi', time: new Date() }]);
    }
    setThinking(false);
  };

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div>
          <h1>Bot AI Ayarlari</h1>
          <p>Otomatik bot cevap sisteminin yapilandirmasi</p>
        </div>
        <button className="btn btn--primary" onClick={saveSettings} disabled={saving}>
          {saving ? 'Kaydediliyor...' : <><Icon name="check" /> Kaydet</>}
        </button>
      </div>

      {/* Master switch */}
      <div className="card">
        <div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: enabled ? 'var(--grad-soft)' : 'rgba(148,163,184,0.08)', display: 'grid', placeItems: 'center', color: enabled ? '#f9a8d4' : 'var(--text-3)' }}>
            <Icon name="aiBrain" size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Bot Sistemi {enabled ? 'Aktif' : 'Devre Disi'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
              {enabled
                ? 'Botlar gelen mesajlara AI ile otomatik yanit veriyor.'
                : 'Botlar mesajlara yanit vermeyecek.'}
            </div>
          </div>
          <Switch size="lg" on={enabled} onChange={setEnabled} />
        </div>
      </div>

      <div className="grid-2">
        {/* Connection config */}
        <div className="card">
          <div className="card__head"><div><div className="card__title">API Baglantisi</div><div className="card__sub">Saglayici uc noktasi ve kimlik bilgileri</div></div></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="API URL" hint="POST destekleyen bir uc nokta">
              <input className="input mono" value={apiUrl} onChange={e => setApiUrl(e.target.value)} style={{ fontSize: 12 }} />
            </Field>
            <Field label="API Key" hint="Anahtar maskelenmis gosteriliyor">
              <div style={{ position: 'relative' }}>
                <input className="input mono" value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ fontSize: 12, paddingRight: 80 }} type={showKey ? 'text' : 'password'} />
                <button className="btn btn--ghost btn--sm" onClick={() => setShowKey(s => !s)} style={{ position: 'absolute', right: 4, top: 4 }}>
                  <Icon name="eye" size={13} /> {showKey ? 'Gizle' : 'Goster'}
                </button>
              </div>
            </Field>
          </div>
        </div>

        {/* Behaviour config */}
        <div className="card">
          <div className="card__head"><div><div className="card__title">Yanit Davranisi</div><div className="card__sub">Gecikme araligi</div></div></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Yanit gecikmesi (ms)" hint="Insan gibi gorunmesi icin rastgele bekleme">
              <div style={{ display: 'flex', gap: 14, flexDirection: 'column' }}>
                <div className="row gap-6">
                  <span style={{ fontSize: 12, color: 'var(--text-3)', minWidth: 32 }}>Min</span>
                  <Slider value={minDelay} min={100} max={maxDelay} step={100} onChange={setMinDelay} format={v => `${v} ms`} />
                </div>
                <div className="row gap-6">
                  <span style={{ fontSize: 12, color: 'var(--text-3)', minWidth: 32 }}>Max</span>
                  <Slider value={maxDelay} min={minDelay} max={20000} step={100} onChange={setMaxDelay} format={v => `${v} ms`} />
                </div>
              </div>
            </Field>
          </div>
        </div>
      </div>

      {/* Test playground */}
      <div className="card">
        <div className="card__head">
          <div><div className="card__title">Canli AI Testi</div><div className="card__sub">Gercek API ile bot yanitlarini test et</div></div>
          <button className="btn btn--ghost btn--sm" onClick={() => setConvo([])}><Icon name="refresh" size={13} /> Sifirla</button>
        </div>
        <div className="card__body">
          {/* Bot persona config */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            <Field label="Bot ismi">
              <input className="input" value={botName} onChange={e => setBotName(e.target.value)} placeholder="Cansu" />
            </Field>
            <Field label="Bot yasi">
              <input className="input" value={botAge} onChange={e => setBotAge(e.target.value)} placeholder="24" />
            </Field>
            <Field label="Bot sehri">
              <input className="input" value={botCity} onChange={e => setBotCity(e.target.value)} placeholder="Istanbul" />
            </Field>
          </div>

          {/* Chat area */}
          <div ref={chatRef} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, minHeight: 300, maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {convo.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div className={`bubble bubble--${m.role === 'error' ? 'error' : m.role}`} style={m.role === 'error' ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' } : {}}>
                    {m.text}
                  </div>
                  {m.latency && (
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, textAlign: 'left', paddingLeft: 4 }}>
                      {m.latency}ms
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div className="bubble bubble--bot" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: 'white', opacity: 0.5, animation: 'blink 1s infinite' }} />
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: 'white', opacity: 0.5, animation: 'blink 1s 0.2s infinite' }} />
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: 'white', opacity: 0.5, animation: 'blink 1s 0.4s infinite' }} />
                </div>
              </div>
            )}
            {convo.length === 0 && !thinking && (
              <div className="empty" style={{ margin: 'auto' }}>
                <Icon name="aiBrain" size={32} />
                <div style={{ marginTop: 8 }}>Gercek AI ile test mesaji yazarak basla</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Sunucudaki bot API ayarlari kullanilir</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            <input className="input" placeholder="Test mesaji yaz..." value={testMsg} onChange={e => setTestMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ flex: 1 }} />
            <button className="btn btn--primary" onClick={send} disabled={thinking}><Icon name="send" /> Gonder</button>
          </div>
          <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: enabled ? '#22c55e' : '#ef4444' }} />
            {enabled ? 'Gercek API baglantisi aktif' : 'Bot sistemi devre disi — test yine de calisir'} &middot; Sunucu uzerinden yanit alinir
          </div>
        </div>
      </div>

      <style>{`@keyframes blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }`}</style>
    </div>
  );
};

window.BotAIPage = BotAIPage;
