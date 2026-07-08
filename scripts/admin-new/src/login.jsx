const LoginPage = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!user.trim() || !pass.trim()) { setError('Kullanici adi ve sifre gerekli'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/admin/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.trim(), password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Giris basarisiz');
      localStorage.setItem('eb_token', data.token);
      onLogin && onLogin();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__logo">E</div>
        <h1>EslesBulus</h1>
        <p className="muted">Yonetim paneline hos geldin</p>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#f87171', fontSize: 13, marginBottom: 8 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Kullanici adi">
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                value={user}
                onChange={e => setUser(e.target.value)}
                style={{ paddingLeft: 36 }}
                placeholder="admin"
                autoFocus
              />
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
                <Icon name="user" size={15} />
              </span>
            </div>
          </Field>
          <Field label="Sifre">
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                style={{ paddingLeft: 36 }}
                placeholder="********"
              />
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
                <Icon name="lock" size={15} />
              </span>
            </div>
          </Field>

          <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', marginTop: 4 }} disabled={loading}>
            {loading ? 'Giris yapiliyor...' : <>Giris Yap <Icon name="arrowRight" size={15} /></>}
          </button>
        </div>

        <div className="login__foot">
          v2.4.1 &middot; &copy; 2026 EslesBulus
        </div>
      </form>
    </div>
  );
};

window.LoginPage = LoginPage;
