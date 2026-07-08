/* ---- Posts ---- */
const PostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

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

      {/* Grid view */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {posts.map(p => {
          const userName = p.userName || p.user?.name || '?';
          const userPhoto = p.user?.photoURL || '';
          const imgUrl = p.imageUrl || p.image || '';
          return (
            <div className="card" key={p._id} style={{ overflow: 'hidden', padding: 0 }}>
              {/* Image */}
              {imgUrl ? (
                <div
                  onClick={() => setPreview(imgUrl)}
                  style={{
                    width: '100%', height: 200, cursor: 'pointer',
                    background: `url(${imgUrl}) center/cover no-repeat`,
                    borderBottom: '1px solid var(--border)',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: 'white' }}>
                    <Icon name="image" size={12} />
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', height: 120, background: 'var(--bg-2)', display: 'grid', placeItems: 'center', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Icon name="posts" size={28} />
                    <div style={{ fontSize: 11, marginTop: 4 }}>Gorsel yok</div>
                  </div>
                </div>
              )}

              {/* Body */}
              <div style={{ padding: '12px 14px' }}>
                {/* User row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  {userPhoto ? (
                    <img src={userPhoto} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <Avatar name={userName} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{userName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtDate(p.createdAt)}</div>
                  </div>
                  <button className="icon-btn" title="Sil" onClick={() => deletePost(p._id)} style={{ flexShrink: 0 }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>

                {/* Caption */}
                {(p.caption || p.text) && (
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.caption || p.text}
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="heart" size={13} /> {p.likesCount || p.likes?.length || p.likeCount || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="chat" size={13} /> {p.commentsCount || p.comments?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {posts.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center' }}>
            <div className="empty">Gonderi yok</div>
          </div>
        )}
      </div>

      {/* Image preview modal */}
      {preview && (
        <Modal open title="Gorsel Onizleme" onClose={() => setPreview(null)}>
          <div style={{ display: 'grid', placeItems: 'center', padding: 8 }}>
            <img src={preview} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 10, objectFit: 'contain' }} />
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ---- Chats ---- */
const ChatsPage = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // secili sohbet (detay)

  const load = async () => {
    setLoading(true);
    try {
      const d = await api('/chats?limit=200');
      setChats(d.chats || d || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div><h1>Sohbetler</h1><p>Konusmalari incele, mesaj at veya sil &mdash; {chats.length} sohbet</p></div>
        <button className="btn btn--ghost" onClick={load}><Icon name="refresh" /> Yenile</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Katilimcilar</th><th>Son Mesaj</th><th>Son Aktivite</th><th></th></tr></thead>
            <tbody>
              {chats.map(c => {
                const pd = c.participantDetails || [];
                const a = pd[0] || {}, b = pd[1] || {};
                return (
                  <tr key={c.chatKey} onClick={() => setActive(c)} style={{ cursor: 'pointer' }} className={active?.chatKey === c.chatKey ? 'is-active' : ''}>
                    <td>
                      <div className="cell-user" style={{ gap: 12 }}>
                        <div style={{ display: 'flex' }}>
                          <Avatar name={a.name} src={a.photoURL} />
                          <div style={{ marginLeft: -10, border: '2px solid var(--card)', borderRadius: '50%' }}><Avatar name={b.name} src={b.photoURL} /></div>
                        </div>
                        <div>
                          <div className="cell-user__name">{(a.name || '?') + '  ↔  ' + (b.name || '?')}</div>
                          <div className="cell-user__id">{c.chatKey}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage || '-'}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{timeAgo(c.lastMessageAt)}</td>
                    <td><div className="actions" onClick={e => e.stopPropagation()}><button className="icon-btn" title="Sohbeti ac" onClick={() => setActive(c)}><Icon name="eye" /></button></div></td>
                  </tr>
                );
              })}
              {chats.length === 0 && <tr><td colSpan="4" className="empty">Sohbet yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <ChatDetailDrawer chat={active} onClose={() => setActive(null)} />
    </div>
  );
};

/* ---- Chat detail drawer ---- */
const ChatDetailDrawer = ({ chat, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendAs, setSendAs] = useState('');      // senderId veya 'system'
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const scrollRef = useRef(null);

  const load = async () => {
    if (!chat) return;
    setLoading(true);
    try {
      const d = await api('/chats/' + chat.chatKey + '/messages');
      setMessages(d.messages || []);
      const pd = chat.participantDetails || [];
      setParts(pd);
      if (pd[0]) setSendAs(pd[0].uid);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { if (chat) load(); }, [chat?.chatKey]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const partMap = {};
  parts.forEach(p => { partMap[p.uid] = p; });

  const delMsg = async (msgId) => {
    if (!confirm('Bu mesaji silmek istiyor musun?')) return;
    try {
      await api('/chats/' + chat.chatKey + '/messages/' + msgId, { method: 'DELETE' });
      setMessages(m => m.filter(x => x._id !== msgId));
      showToast('Mesaj silindi');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const asSystem = sendAs === 'system';
      const res = await api('/chats/' + chat.chatKey + '/send', {
        method: 'POST',
        body: { senderId: asSystem ? undefined : sendAs, asSystem, text: text.trim() },
      });
      setMessages(m => [...m, { ...res.message, senderName: asSystem ? 'Sistem' : (partMap[sendAs]?.name || ''), senderPhoto: asSystem ? '' : (partMap[sendAs]?.photoURL || '') }]);
      setText('');
      showToast('Mesaj gonderildi');
    } catch (e) { showToast(e.message, 'error'); }
    setSending(false);
  };

  const aiReply = async () => {
    setAiBusy(true);
    try {
      const res = await api('/chats/' + chat.chatKey + '/ai-reply', { method: 'POST', body: { botUid: sendAs === 'system' ? undefined : sendAs } });
      if (res.suggestion) { setText(res.suggestion); showToast('AI onerisi hazir — duzenleyip gonderebilirsin'); }
      else showToast(res.error || 'AI yanit uretemedi', 'error');
    } catch (e) { showToast(e.message, 'error'); }
    setAiBusy(false);
  };

  return (
    <Drawer
      open={!!chat}
      onClose={onClose}
      title="Sohbet Detayi"
      width="640px"
      foot={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Gonderen:</span>
            <select className="select" value={sendAs} onChange={e => setSendAs(e.target.value)} style={{ flex: 1 }}>
              {parts.map(p => <option key={p.uid} value={p.uid}>{p.name} adina</option>)}
              <option value="system">Sistem mesaji</option>
            </select>
            <button className="btn btn--ghost btn--sm" onClick={aiReply} disabled={aiBusy || sendAs === 'system'} title="AI ile yanit oner">
              {aiBusy ? '...' : <><Icon name="aiBrain" size={14} /> AI</>}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Mesaj yaz..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ flex: 1 }} />
            <button className="btn btn--primary" onClick={send} disabled={sending}><Icon name="send" /> Gonder</button>
          </div>
        </div>
      }
    >
      {loading ? <Loader /> : (
        <div ref={scrollRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '100%', overflowY: 'auto', paddingRight: 4 }}>
          {messages.length === 0 && <div className="empty" style={{ padding: 30 }}>Mesaj yok</div>}
          {messages.map((m, i) => {
            const isSystem = m.senderId === 'system';
            const photo = m.senderPhoto || partMap[m.senderId]?.photoURL;
            const name = isSystem ? 'Sistem' : (m.senderName || partMap[m.senderId]?.name || m.senderId);
            return (
              <div key={m._id || i} className="chat-msg-row" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 4px', borderRadius: 8 }}>
                <Avatar name={name} src={photo} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtDate(m.createdAt)}</span>
                    {m.status && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {m.status}</span>}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--text)', marginTop: 2, wordBreak: 'break-word' }}>
                    {m.type === 'image' && m.imageUrl ? <img src={m.imageUrl} style={{ maxWidth: 180, borderRadius: 8, display: 'block', marginTop: 4 }} /> :
                     m.type === 'video' ? '🎥 Video' :
                     m.type === 'audio' ? '🎤 Sesli mesaj' :
                     m.type === 'gift' ? ('🎁 ' + (m.gift?.name || 'Hediye')) :
                     m.deleted ? <i style={{ color: 'var(--text-3)' }}>Bu mesaj silindi</i> :
                     (m.text || '-')}
                  </div>
                </div>
                <button className="icon-btn" title="Mesaji sil" onClick={() => delMsg(m._id)}><Icon name="trash" size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};

/* ---- Stories ---- */
const StoriesPage = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

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

      {/* Grid of story cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {stories.map(s => {
          const userName = s.userName || s.user?.name || '?';
          const userPhoto = s.user?.photoURL || '';
          const imgUrl = s.imageUrl || s.image || '';
          const expired = s.expiresAt && new Date(s.expiresAt) < new Date();
          return (
            <div className="card" key={s._id} style={{ overflow: 'hidden', padding: 0, position: 'relative' }}>
              {/* Story image */}
              <div
                onClick={() => imgUrl && setPreview(imgUrl)}
                style={{
                  width: '100%', height: 300,
                  background: imgUrl ? `url(${imgUrl}) center/cover no-repeat` : 'linear-gradient(135deg, var(--bg-2), var(--card))',
                  cursor: imgUrl ? 'pointer' : 'default',
                  position: 'relative',
                }}
              >
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />

                {/* Expired badge */}
                {expired && (
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,0.85)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: 'white', fontWeight: 600 }}>
                    Suresi doldu
                  </div>
                )}

                {/* Delete button */}
                <button
                  className="icon-btn"
                  title="Sil"
                  onClick={(e) => { e.stopPropagation(); deleteStory(s._id); }}
                  style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 8 }}
                >
                  <Icon name="trash" size={14} />
                </button>

                {/* Bottom info */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {userPhoto ? (
                      <img src={userPhoto} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(168,85,247,0.6)' }} />
                    ) : (
                      <Avatar name={userName} size={28} />
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{userName}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{timeAgo(s.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats bar */}
              <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="eye" size={13} /> {s.views?.length || s.viewCount || 0}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="heart" size={13} /> {s.likesCount || s.likedBy?.length || 0}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="chat" size={13} /> {s.repliesCount || s.replies?.length || 0}
                </span>
              </div>

              {/* Caption */}
              {s.caption && (
                <div style={{ padding: '0 12px 10px', fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.caption}
                </div>
              )}
            </div>
          );
        })}
        {stories.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center' }}>
            <div className="empty">Hikaye yok</div>
          </div>
        )}
      </div>

      {/* Image preview modal */}
      {preview && (
        <Modal open title="Hikaye Onizleme" onClose={() => setPreview(null)}>
          <div style={{ display: 'grid', placeItems: 'center', padding: 8 }}>
            <img src={preview} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 10, objectFit: 'contain' }} />
          </div>
        </Modal>
      )}
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
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api('/gifts');
      setGifts(d.gifts || d || []);
      setStats(d.stats || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="page fade-in"><Loader /></div>;

  const statMap = {};
  stats.forEach(s => { statMap[s._id] = s.count; });

  const normal = gifts.filter(g => !g.vip);
  const vip = gifts.filter(g => g.vip);
  const RARITY = { common: '#94a3b8', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' };

  const GiftCard = (g) => (
    <div key={g._id || g.giftId} style={{ background: 'var(--bg-2)', border: `1px solid ${g.vip ? 'rgba(212,175,55,0.4)' : 'var(--border)'}`, borderRadius: 12, padding: 16, textAlign: 'center', position: 'relative' }}>
      {g.vip && <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 700, color: '#D4AF37', background: 'rgba(212,175,55,0.12)', padding: '2px 7px', borderRadius: 6 }}>👑 VIP</div>}
      <div style={{ fontSize: 44, marginBottom: 10 }}>{g.emoji || '🎁'}</div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div>
      {g.rarity && <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: RARITY[g.rarity] || 'var(--text-3)', marginTop: 2 }}>{g.rarity}</div>}
      <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 4, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {g.price || 0} <span style={{ fontSize: 11, color: 'var(--text-3)', WebkitTextFillColor: 'var(--text-3)' }}>jeton</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
        {(statMap[g.name] || 0).toLocaleString('tr-TR')} gonderim
      </div>
    </div>
  );

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div><h1>Hediyeler</h1><p>{normal.length} normal · {vip.length} VIP hediye</p></div>
        <button className="btn btn--ghost" onClick={load}><Icon name="refresh" /> Yenile</button>
      </div>

      {gifts.length === 0 && (
        <div className="card"><div className="card__body"><div className="empty" style={{ padding: 30 }}>Hediye tanimlanmamis</div></div></div>
      )}

      {normal.length > 0 && (
        <div className="card">
          <div className="card__head"><div><div className="card__title">Normal Hediyeler</div><div className="card__sub">Tum kullanicilara acik</div></div></div>
          <div className="card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {normal.map(GiftCard)}
          </div>
        </div>
      )}

      {vip.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
          <div className="card__head"><div><div className="card__title" style={{ color: '#D4AF37' }}>👑 VIP Hediyeler</div><div className="card__sub">Sadece premium/VIP uyeler</div></div></div>
          <div className="card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {vip.map(GiftCard)}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---- Analytics ---- */
const AnalyticsPage = () => {
  const { data, loading, error, reload } = useApi('/analytics');

  if (loading) return <div className="page fade-in"><Loader /></div>;
  if (error) return <div className="page fade-in"><ErrorBox msg={error} onRetry={reload} /></div>;

  const d = data || {};
  const regTrend = (d.registrationTrend || []).map(r => ({ l: r.label || r.date || '', v: r.count || 0 }));
  const cities = (d.cityDistribution || []).slice(0, 8);
  const maxCity = Math.max(...cities.map(c => c.count || 0), 1);
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
