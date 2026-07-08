const QuickReplyPage = () => {
  const [data, setData] = useState({ chats: [], bots: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('waiting'); // waiting | all
  const [active, setActive] = useState(null);       // secili sohbet
  const [replies, setReplies] = useState([]);       // hazir cevaplar

  const load = async () => {
    setLoading(true);
    try { setData(await api('/manual-bot-chats')); } catch (e) { console.error(e); }
    setLoading(false);
  };
  const loadReplies = async () => {
    try { const d = await api('/quick-replies'); setReplies(d.replies || []); } catch (e) {}
  };
  useEffect(() => { load(); loadReplies(); }, []);

  const list = (data.chats || []).filter(c => filter === 'all' ? true : c.waitingReply);
  const waitingCount = (data.chats || []).filter(c => c.waitingReply).length;

  if (loading) return <div className="page fade-in"><Loader /></div>;

  return (
    <div className="page fade-in">
      <div className="page__head">
        <div>
          <h1>Hizli Cevap</h1>
          <p>Manuel bot hesaplarina gelen mesajlara hizlica yanit ver &mdash; {waitingCount} yanit bekliyor</p>
        </div>
        <button className="btn btn--ghost" onClick={load}><Icon name="refresh" /> Yenile</button>
      </div>

      {(data.bots || []).length === 0 ? (
        <div className="card"><div className="card__body"><div className="empty" style={{ padding: 30 }}>
          Manuel bot (fake-manual) hesabi yok. Once "Sahte Kullanicilar" bolumunden manuel bot olustur.
        </div></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Sol: sohbet listesi */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="filters" style={{ gap: 4, padding: 10 }}>
              <button className="btn btn--sm" onClick={() => setFilter('waiting')} style={{ background: filter === 'waiting' ? 'var(--grad-soft)' : 'transparent', borderColor: filter === 'waiting' ? 'rgba(168,85,247,0.4)' : 'var(--border)', color: filter === 'waiting' ? 'white' : 'var(--text-2)' }}>
                Yanit bekleyen <span style={{ opacity: 0.7 }}>{waitingCount}</span>
              </button>
              <button className="btn btn--sm" onClick={() => setFilter('all')} style={{ background: filter === 'all' ? 'var(--grad-soft)' : 'transparent', borderColor: filter === 'all' ? 'rgba(168,85,247,0.4)' : 'var(--border)', color: filter === 'all' ? 'white' : 'var(--text-2)' }}>
                Tumu <span style={{ opacity: 0.7 }}>{(data.chats || []).length}</span>
              </button>
            </div>
            <div style={{ maxHeight: 560, overflowY: 'auto' }}>
              {list.length === 0 && <div className="empty" style={{ padding: 24 }}>Sohbet yok</div>}
              {list.map(c => (
                <div
                  key={c.chatKey}
                  onClick={() => setActive(c)}
                  style={{
                    display: 'flex', gap: 10, padding: '10px 12px', cursor: 'pointer', alignItems: 'center',
                    borderBottom: '1px solid var(--border)',
                    background: active?.chatKey === c.chatKey ? 'var(--grad-soft)' : 'transparent',
                  }}
                >
                  <Avatar name={c.user?.name} src={c.user?.photoURL} online={c.user?.online} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.user?.name || '?'}</span>
                      {c.waitingReply && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} title="Yanit bekliyor" />}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage || '-'}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>→ {c.bot?.name} · {timeAgo(c.lastMessageAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sag: konusma + cevap */}
          {active ? (
            <QuickReplyConversation chat={active} replies={replies} onSent={load} key={active.chatKey} />
          ) : (
            <div className="card" style={{ minHeight: 400 }}>
              <div className="card__body" style={{ display: 'grid', placeItems: 'center', minHeight: 360 }}>
                <div className="empty">Soldan bir sohbet sec</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hazir cevap yonetimi */}
      <QuickRepliesManager replies={replies} reload={loadReplies} />
    </div>
  );
};

const QuickReplyConversation = ({ chat, replies, onSent }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const scrollRef = useRef(null);

  const botUid = chat.bot?.uid;
  const userUid = chat.user?.uid;

  const load = async () => {
    setLoading(true);
    try { const d = await api('/chats/' + chat.chatKey + '/messages'); setMessages(d.messages || []); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [chat.chatKey]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const send = async (msgText) => {
    const body = (msgText != null ? msgText : text).trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await api('/chats/' + chat.chatKey + '/send', { method: 'POST', body: { senderId: botUid, text: body } });
      setMessages(m => [...m, { ...res.message, senderName: chat.bot?.name, senderPhoto: chat.bot?.photoURL }]);
      setText('');
      onSent && onSent();
    } catch (e) { showToast(e.message, 'error'); }
    setSending(false);
  };

  const aiReply = async () => {
    setAiBusy(true);
    try {
      const res = await api('/chats/' + chat.chatKey + '/ai-reply', { method: 'POST', body: { botUid } });
      if (res.suggestion) { setText(res.suggestion); showToast('AI onerisi hazir'); }
      else showToast(res.error || 'AI yanit uretemedi', 'error');
    } catch (e) { showToast(e.message, 'error'); }
    setAiBusy(false);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>
      {/* Baslik */}
      <div className="card__head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={chat.user?.name} src={chat.user?.photoURL} online={chat.user?.online} />
          <div>
            <div className="card__title">{chat.user?.name}</div>
            <div className="card__sub">{chat.bot?.name} adina yanitliyorsun</div>
          </div>
        </div>
      </div>

      {/* Mesajlar */}
      <div ref={scrollRef} style={{ flex: 1, maxHeight: 380, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? <Loader /> : messages.length === 0 ? <div className="empty">Mesaj yok</div> : messages.map((m, i) => {
          const fromBot = m.senderId === botUid;
          return (
            <div key={m._id || i} style={{ display: 'flex', justifyContent: fromBot ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '8px 12px', borderRadius: 12, fontSize: 13.5,
                background: fromBot ? 'var(--grad)' : 'var(--bg-2)',
                color: fromBot ? 'white' : 'var(--text)',
                border: fromBot ? 'none' : '1px solid var(--border)',
              }}>
                {m.type === 'image' && m.imageUrl ? <img src={m.imageUrl} style={{ maxWidth: 160, borderRadius: 8, display: 'block' }} /> :
                 m.type === 'audio' ? '🎤 Sesli mesaj' :
                 m.type === 'gift' ? ('🎁 ' + (m.gift?.name || 'Hediye')) :
                 (m.text || '-')}
                <div style={{ fontSize: 9.5, opacity: 0.7, marginTop: 3, textAlign: 'right' }}>{fmtDate(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hazir cevaplar */}
      {replies.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
          {replies.map(r => (
            <button key={r._id} className="btn btn--ghost btn--sm" onClick={() => send(r.text)} disabled={sending} title="Tikla ve gonder" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.text}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn--ghost btn--sm" onClick={aiReply} disabled={aiBusy} title="AI ile yanit oner">
          {aiBusy ? '...' : <><Icon name="aiBrain" size={15} /></>}
        </button>
        <input className="input" placeholder={`${chat.bot?.name} adina yaz...`} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ flex: 1 }} />
        <button className="btn btn--primary" onClick={() => send()} disabled={sending}><Icon name="send" /> Gonder</button>
      </div>
    </div>
  );
};

const QuickRepliesManager = ({ replies, reload }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { await api('/quick-replies', { method: 'POST', body: { text: text.trim() } }); setText(''); reload(); showToast('Hazir cevap eklendi'); }
    catch (e) { showToast(e.message, 'error'); }
    setBusy(false);
  };
  const del = async (id) => {
    try { await api('/quick-replies/' + id, { method: 'DELETE' }); reload(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  return (
    <div className="card">
      <div className="card__head"><div><div className="card__title">Hazir Cevaplar</div><div className="card__sub">Sik kullandigin yanitlari kaydet, tek tikla gonder</div></div></div>
      <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Yeni hazir cevap ekle..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} style={{ flex: 1 }} />
          <button className="btn btn--primary" onClick={add} disabled={busy}><Icon name="plus" /> Ekle</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {replies.length === 0 && <div className="empty" style={{ padding: 12 }}>Henuz hazir cevap yok</div>}
          {replies.map(r => (
            <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 6px 4px 12px' }}>
              <span style={{ fontSize: 13 }}>{r.text}</span>
              <button className="icon-btn" title="Sil" onClick={() => del(r._id)} style={{ width: 24, height: 24 }}><Icon name="close" size={13} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

window.QuickReplyPage = QuickReplyPage;
