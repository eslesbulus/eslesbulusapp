const NAV = [
  { id: 'dashboard',     label: 'Dashboard',          icon: 'dashboard' },
  { id: 'users',         label: 'Kullanicilar',       icon: 'users' },
  { id: 'posts',         label: 'Gonderiler',         icon: 'posts' },
  { id: 'chats',         label: 'Sohbetler',          icon: 'chat' },
  { id: 'stories',       label: 'Hikayeler',          icon: 'story' },
  { id: 'reports',       label: 'Raporlar',           icon: 'report' },
  { id: 'notifications', label: 'Bildirimler',        icon: 'bell' },
  { id: 'gifts',         label: 'Hediyeler',          icon: 'gift' },
  { id: 'analytics',     label: 'Analitik',           icon: 'analytics' },
  { id: 'health',        label: 'Sistem Sagligi',     icon: 'health' },
  { id: '__sep1',        label: 'Bot Yonetimi' },
  { id: 'bots',          label: 'Sahte Kullanicilar', icon: 'bot' },
  { id: 'quick-reply',   label: 'Hizli Cevap',        icon: 'send' },
  { id: 'bot-ai',        label: 'Bot AI Ayarlari',    icon: 'aiBrain' },
  { id: '__sep2',        label: 'Sistem' },
  { id: 'settings',      label: 'Genel Ayarlar',      icon: 'settings' },
];

const PAGES = {
  dashboard:     { title: 'Dashboard',           crumb: 'Anasayfa',            Comp: DashboardPage },
  users:         { title: 'Kullanicilar',        crumb: 'Yonetim',             Comp: UsersPage },
  posts:         { title: 'Gonderiler',          crumb: 'Icerik',              Comp: PostsPage },
  chats:         { title: 'Sohbetler',           crumb: 'Icerik',              Comp: ChatsPage },
  stories:       { title: 'Hikayeler',           crumb: 'Icerik',              Comp: StoriesPage },
  reports:       { title: 'Raporlar',            crumb: 'Moderasyon',          Comp: ReportsPage },
  notifications: { title: 'Bildirimler',         crumb: 'Mesajlasma',          Comp: NotificationsPage },
  gifts:         { title: 'Hediyeler',           crumb: 'Magaza',              Comp: GiftsPage },
  analytics:     { title: 'Analitik',            crumb: 'Analiz',              Comp: AnalyticsPage },
  health:        { title: 'Sistem Sagligi',      crumb: 'Operasyon',           Comp: HealthPage },
  bots:          { title: 'Sahte Kullanicilar',  crumb: 'Bot',                 Comp: BotsPage },
  'quick-reply': { title: 'Hizli Cevap',         crumb: 'Bot',                 Comp: QuickReplyPage },
  'bot-ai':      { title: 'Bot AI Ayarlari',     crumb: 'Bot',                 Comp: BotAIPage },
  settings:      { title: 'Genel Ayarlar',       crumb: 'Sistem',              Comp: SettingsPage },
};

const App = () => {
  const [authed, setAuthed] = useState(false);
  const [route, setRoute] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('eb_token');
    if (token) setAuthed(true);
  }, []);

  const doLogin = () => { setAuthed(true); };
  const doLogout = () => {
    localStorage.removeItem('eb_token');
    setAuthed(false);
  };

  if (!authed) return <LoginPage onLogin={doLogin} />;

  const page = PAGES[route] || PAGES.dashboard;
  const Comp = page.Comp;

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      {/* Toast container */}
      <div id="toast-container" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">E</div>
          <div className="sidebar__name">
            EslesBulus<small>Admin Panel</small>
          </div>
        </div>
        <nav className="sidebar__nav">
          {NAV.map((item) => {
            if (item.id.startsWith('__sep')) {
              return <div className="sidebar__section-label" key={item.id}>{item.label}</div>;
            }
            const active = route === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => setRoute(item.id)}
                title={collapsed ? item.label : ''}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.badge && <span className="nav-item__badge">{item.badge}</span>}
              </div>
            );
          })}
        </nav>
        <div className="sidebar__toggle" onClick={() => setCollapsed(c => !c)}>
          <Icon name="collapse" />
          <span>Menuyu daralt</span>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="header">
          <div>
            <div className="header__title">{page.title}</div>
            <div className="header__crumb">{page.crumb}</div>
          </div>
          <div className="header__right">
            <div className="avatar-chip" title="Admin">
              <div className="avatar-chip__avatar">A</div>
              <div>
                <div className="avatar-chip__name">Admin</div>
                <div className="avatar-chip__role">Super Admin</div>
              </div>
            </div>
            <button className="icon-btn" title="Cikis yap" onClick={doLogout}>
              <Icon name="logout" />
            </button>
          </div>
        </header>

        <Comp key={route} />
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
