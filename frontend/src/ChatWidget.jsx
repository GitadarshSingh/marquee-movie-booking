import { useEffect, useRef, useState } from 'react';
import { askAI, getMyBookings, cancelBooking } from './api.js';

const CHIPS = ['My bookings', 'Cancel booking', 'Hindi action', 'Comedy', 'Thriller'];

const GREETINGS = [
  'Hey there! Ready for a movie? 🎬',
  '"Why so serious?" Let\'s find you a fun movie! 🍿',
  '"May the Force be with you." Pick a movie! 🌌',
  '"I\'ll be back." Right after you find a movie! 🎥',
  '"Life is like a box of chocolates." So are movies! 🍫',
  '"Go ahead, make my day." Ask me for a movie! 🎞️',
];
const pickGreeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

const hasPoster = (m) => m?.posterUrl && !m.posterUrl.includes('placehold.co');
const isBookingQuery = (q) => /booking|ticket|booked|cancel/i.test(q);
const isCancelQuery = (q) => /cancel/i.test(q);
const fmt = (s) => new Date(s).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const canCancel = (b) => b.show?.startTime && new Date(b.show.startTime) > new Date();

// hidden bookings (sirf is browser mein hide, database mein booking rehti hai)
const HIDE_KEY = 'hiddenBookings';
const getHidden = () => {
  try { return JSON.parse(localStorage.getItem(HIDE_KEY) || '[]'); } catch { return []; }
};

const clean = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = ['cancel', 'cancell', 'cancle', 'booking', 'bookings', 'ticket', 'tickets', 'the', 'my', 'movie', 'please', 'for', 'show'];

// keep only bookings whose movie title matches words in the message
const matchByTitle = (list, q) => {
  const words = clean(q).split(' ').filter((w) => w.length > 2 && !STOP.includes(w));
  if (!words.length) return list;
  return list.filter((b) => {
    const t = clean(b.show?.movie?.title);
    return words.some((w) => t.includes(w));
  });
};

export default function ChatWidget({ movies = [] }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [chat, setChat] = useState([]);
  const [busy, setBusy] = useState(false);
  const [greeting, setGreeting] = useState(pickGreeting);
  const [confirmId, setConfirmId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [popup, setPopup] = useState(null);
  const session = useRef(0);
  const endRef = useRef(null);

  useEffect(() => {
  const h = () => setOpen(true);
  window.addEventListener('open-chat', h);
  return () => window.removeEventListener('open-chat', h);
}, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, busy]);

  const clearChat = () => {
    session.current += 1;
    setChat([]);
    setText('');
    setBusy(false);
    setConfirmId(null);
    setCancellingId(null);
    setPopup(null);
    setGreeting(pickGreeting());
  };

  const closeChat = () => {
    clearChat();
    setOpen(false);
  };

  const addAi = (msg) => setChat((c) => [...c, { who: 'ai', ...msg }]);

  const loadBookings = async (cancelMode, q = '') => {
    if (!localStorage.getItem('token')) {
      addAi({ text: 'Please log in first to see your bookings.' });
      return;
    }
    const r = await getMyBookings();
    if (!r.live) {
      addAi({ text: "Couldn't load bookings. Is the backend running?" });
      return;
    }
    const hidden = getHidden();
    const all = [...r.data]
      .filter((b) => b.status === 'CONFIRMED' && !hidden.includes(b.id))
      .sort((a, b) => b.id - a.id);
    if (!all.length) {
      addAi({ text: 'You have no confirmed bookings yet.' });
      return;
    }
    const list = matchByTitle(all, q);
    if (!list.length) {
      addAi({ text: "I couldn't find a confirmed booking with that movie name. Here are all your bookings:", bookings: all });
      return;
    }
    addAi({
      text: cancelMode
        ? (list.length === all.length
            ? 'Tap "Cancel booking" on the one you want to cancel:'
            : `Found ${list.length} matching booking(s). Tap "Cancel booking" to cancel:`)
        : `You have ${list.length} confirmed booking(s):`,
      bookings: list,
    });
  };

  const doCancel = async (id) => {
    setCancellingId(id);
    try {
      await cancelBooking(id);
      setChat((c) => c.map((m) => (m.bookings
        ? { ...m, bookings: m.bookings.filter((b) => b.id !== id) }
        : m)));
      addAi({ text: 'Your booking has been cancelled and the seats are released. ✅' });
    } catch (e) {
      addAi({ text: 'Could not cancel: ' + e.message });
    }
    setCancellingId(null);
    setConfirmId(null);
  };

  // hide a past booking from the chat list (stays in database)
  const removeFromList = (id) => {
    localStorage.setItem(HIDE_KEY, JSON.stringify([...getHidden(), id]));
    setChat((c) => c.map((m) => (m.bookings
      ? { ...m, bookings: m.bookings.filter((b) => b.id !== id) }
      : m)));
    setPopup(null);
    addAi({ text: 'Removed from your list. ✅' });
  };

  const send = async (msg) => {
    const q = (msg ?? text).trim();
    if (!q || busy) return;
    const mySession = session.current;
    setText('');
    setBusy(true);
    setChat((c) => [...c, { who: 'me', text: q }]);
    try {
      if (isBookingQuery(q)) {
        await loadBookings(isCancelQuery(q), q);
      } else {
        const r = await askAI(q);
        if (mySession !== session.current) return;
        addAi({ text: r.reply, movies: r.movies });
      }
    } catch (e) {
      if (mySession !== session.current) return;
      addAi({ text: 'Error: ' + e.message });
    }
    if (mySession === session.current) setBusy(false);
  };

  const goMovie = (id) => {
    window.location.hash = `/movie/${id}`;
    closeChat();
  };

  const full = (mv) => movies.find((x) => x.id === mv.id) || mv;

  return (
    <>
      <button className="chat-fab" onClick={() => (open ? closeChat() : setOpen(true))}>💬</button>
      {open && (
        <div className="chat-box">
          <div className="chat-head">
            <b>Movie Assistant</b>
            <div className="chat-head-btns">
              <button onClick={clearChat} title="Clear chat" disabled={chat.length === 0 && !busy}>🗑 Clear</button>
              <button onClick={closeChat} title="Close" aria-label="Close">✕</button>
            </div>
          </div>

          <div className="chat-msgs">
            <div className="chat-ai">{greeting}</div>

            {chat.length === 0 && (
              <div className="chat-chips">
                {CHIPS.map((c) => (
                  <button key={c} className="chip" onClick={() => send(c)}>{c}</button>
                ))}
              </div>
            )}

            {chat.map((m, i) => (
              <div key={i} className={`chat-${m.who}`}>
                {m.text}

                {m.movies?.length > 0 && (
                  <div className="mcards">
                    {m.movies.map((mv) => {
                      const f = full(mv);
                      const rate = Number(f.rating);
                      return (
                        <div className="mcard" key={mv.id}>
                          {hasPoster(f)
                            ? <img src={f.posterUrl} alt={f.title} />
                            : <div className="mcard-ph">{f.title}</div>}
                          <div className="mcard-info">
                            <b>{f.title}</b>
                            <small>
                              {Number.isFinite(rate) && rate > 0 ? `★ ${rate.toFixed(1)} · ` : ''}
                              {f.language}
                            </small>
                            <button className="btn sm" onClick={() => goMovie(mv.id)}>Book now</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {m.bookings?.length > 0 && (
                  <div className="mcards">
                    {m.bookings.map((b) => {
                      const mv = b.show?.movie || {};
                      const f = full(mv);
                      return (
                        <div className="mcard" key={b.id}>
                          {hasPoster(f)
                            ? <img src={f.posterUrl} alt={mv.title} />
                            : <div className="mcard-ph">{mv.title}</div>}
                          <div className="mcard-info">
                            <b>{mv.title}</b>
                            <small>{b.show?.screen?.theater?.name} · {b.show?.screen?.name}</small>
                            <small>{b.show?.startTime && fmt(b.show.startTime)}</small>
                            <small>Seats: {(b.seats || []).map((s) => s.seat?.seatNumber).join(', ') || '—'}</small>
                            <small>₹{b.totalAmount} · {b.bookingNumber}</small>

                            {canCancel(b) ? (
                              confirmId === b.id ? (
                                <div className="mcard-actions">
                                  <small className="warn-txt">Cancel this booking?</small>
                                  <div className="row">
                                    <button className="btn sm danger" disabled={cancellingId === b.id}
                                      onClick={() => doCancel(b.id)}>
                                      {cancellingId === b.id ? 'Cancelling…' : 'Yes, cancel'}
                                    </button>
                                    <button className="ghost sm" disabled={cancellingId === b.id}
                                      onClick={() => setConfirmId(null)}>Keep</button>
                                  </div>
                                </div>
                              ) : (
                                <button className="ghost sm danger-outline" onClick={() => setConfirmId(b.id)}>
                                  Cancel booking
                                </button>
                              )
                            ) : (
                              <button className="ghost sm danger-outline" onClick={() => setPopup(b)}>
                                Cancel booking
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="chat-ai thinking">
                Thinking<span className="dots-anim"><i>.</i><i>.</i><i>.</i></span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chat-in">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask for a movie, 'my bookings' or 'cancel'…"
            />
            <button className="btn" onClick={() => send()}>Send</button>
          </div>

          {popup && (
            <div className="chat-popup-bg" onClick={() => setPopup(null)}>
              <div className="chat-popup" onClick={(e) => e.stopPropagation()}>
                <h4>Cancellation not allowed</h4>
                <p>
                  You can't cancel this booking because the show
                  {popup.show?.startTime ? ` (${fmt(popup.show.startTime)})` : ''} has already
                  started or is over. If you have already watched it, you can remove it from your list.
                </p>
                <div className="popup-btns">
                  <button className="btn sm" onClick={() => removeFromList(popup.id)}>Remove from list</button>
                  <button className="ghost sm" onClick={() => setPopup(null)}>OK</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}