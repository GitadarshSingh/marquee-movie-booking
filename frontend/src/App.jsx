import { useEffect, useMemo, useState } from 'react';
import { getMovies, getShows, getSeats, getMyBookings, loginApi, signupApi, checkPhone, payForSeats, releasePending } from './api.js';
import ChatWidget from './ChatWidget.jsx';

const APP_NAME = 'Marquee';
const MAX_SEATS = 8;

const fmt = (s) => new Date(s).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtTime = (s) => new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => { const x = new Date(d); return isNaN(x) ? '' : x.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }); };
const fmtDur = (m) => (m ? `${Math.floor(m / 60)}h ${m % 60}m` : '');
const hue = (t) => [...t].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
const hasPoster = (m) => m.posterUrl && !m.posterUrl.includes('placehold.co');
const genreText = (m) => (m.genre || '').replace(/\//g, ', ');
const certLang = (m) => [m.certificate, m.language].filter(Boolean).join(' | ');
const certGenre = (m) => [m.certificate, genreText(m)].filter(Boolean).join(' | ');
const rateOf = (m) => { const r = Number(m.rating); return Number.isFinite(r) && r > 0 ? r.toFixed(1) : null; };
const isRecent = (m) => { if (!m.releaseDate) return false; const d = Date.now() - new Date(m.releaseDate).getTime(); return d > -30 * 864e5 && d < 120 * 864e5; };

// aaj ki local date (YYYY-MM-DD). toISOString use nahi kiya, wo UTC deta hai.
const todayStr = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* ---------- Mini router (# based) ---------- */
const go = (path) => { window.location.hash = path; };
function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const f = () => { setHash(window.location.hash); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

/* ---------- Screen width ke hisaab se columns (6 / 4 / 2) ---------- */
function useCols() {
  const calc = () => (window.innerWidth >= 1100 ? 6 : window.innerWidth >= 800 ? 4 : 2);
  const [c, setC] = useState(calc);
  useEffect(() => {
    const f = () => setC(calc());
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return c;
}

/* ---------- Logo ---------- */
function Logo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label={APP_NAME}>
      <rect width="100" height="100" rx="26" fill="#5b3df5" />
      {[20, 35, 50, 65, 80].map((x) => <circle key={`t${x}`} cx={x} cy="17" r="3.4" fill="#fff" opacity=".75" />)}
      {[20, 35, 50, 65, 80].map((x) => <circle key={`b${x}`} cx={x} cy="86" r="3.4" fill="#fff" opacity=".75" />)}
      <text x="50" y="68" textAnchor="middle" fontSize="54" fontWeight="800" fill="#fff" fontFamily="Inter, Arial, sans-serif">M</text>
    </svg>
  );
}

function Poster({ m, className = '' }) {
  const [bad, setBad] = useState(!hasPoster(m));
  return bad
    ? <div className={`poster fallback ${className}`} style={{ background: `linear-gradient(160deg,hsl(${hue(m.title)} 55% 42%),hsl(${(hue(m.title) + 40) % 360} 45% 22%))` }}><span>{m.title}</span></div>
    : <img className={`poster ${className}`} src={m.posterUrl} alt={m.title} loading="lazy" onError={() => setBad(true)} />;
}

/* ---------- Hero carousel ---------- */
function Carousel({ movies, onBook }) {
  const [i, setI] = useState(0);
  const n = movies.length;
  useEffect(() => {
    if (n < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, i]);
  if (!n) return null;
  const m = movies[i % n];
  const desc = m.description || [genreText(m), m.language, fmtDur(m.durationMins)].filter(Boolean).join(' · ');
  return (
    <header className="hero">
      <div className="hero-in" key={m.id}>
        <div className="hero-text">
          <h1>{m.title}</h1>
          <div className="hero-sub">{certGenre(m) || m.language}</div>
          <p className="hero-desc">{desc}</p>
          <button className="btn" onClick={() => onBook(m)}>Book now</button>
        </div>
        <div className="hero-poster"><Poster m={m} /></div>
      </div>
      {n > 1 && (
        <>
          <button className="arrow l" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous">‹</button>
          <button className="arrow r" onClick={() => setI((i + 1) % n)} aria-label="Next">›</button>
          <div className="dots">{movies.map((x, k) => <button key={x.id} className={k === i % n ? 'on' : ''} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} />)}</div>
        </>
      )}
    </header>
  );
}

/* ---------- Profile menu (right-side panel) ---------- */
function ProfileMenu({ user, onLogin, onLogout }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);
  if (!user) return <button className="avatar" onClick={onLogin} aria-label="Login">👤</button>;

  const close = () => setOpen(false);
  const Row = ({ icon, label, onClick }) => (
    <button className="pf-row" onClick={onClick}>
      <span className="pf-ico">{icon}</span><span>{label}</span><span className="pf-arrow">›</span>
    </button>
  );

  return (
    <>
      <button className="avatar in" onClick={() => setOpen(true)}>{(user.name || 'U')[0].toUpperCase()}</button>

      {open && (
        <>
          <div className="pf-bg" onClick={close} />
          <aside className="pf-panel">
            <div className="pf-head">
              <button className="pf-back" onClick={close} aria-label="Back">←</button>
              <b>Profile</b>
            </div>

            <div className="pf-user">
              <div className="pf-avatar">{(user.name || 'U')[0].toUpperCase()}</div>
              <div>
                <h3>{user.name}</h3>
                <small>{user.phone ? `+91 ${user.phone}` : user.email}</small>
              </div>
            </div>

            <div className="pf-card">
              <Row icon="🧾" label="View all bookings" onClick={() => { close(); go('/bookings'); }} />
            </div>

            <h4 className="pf-sec">Support</h4>
            <div className="pf-card">
              <Row icon="💬" label="Chat with us" onClick={() => { close(); window.dispatchEvent(new Event('open-chat')); }} />
            </div>

            <h4 className="pf-sec">More</h4>
            <div className="pf-card">
              <Row icon="❓" label="Terms & Conditions" onClick={() => setInfo({ t: 'Terms & Conditions', b: 'This is a demo movie booking project built by Adarsh. Bookings and payments run in test mode only. Bookings can be cancelled only before the show starts.' })} />
              <Row icon="📄" label="Privacy Policy" onClick={() => setInfo({ t: 'Privacy Policy', b: 'We only store the details you give us (name, email, phone) to manage your bookings. Payments are handled by Razorpay and we never store card details.' })} />
            </div>

            <div className="pf-card" style={{ marginTop: 20 }}>
              <Row icon="↪" label="Logout" onClick={() => { close(); onLogout(); }} />
            </div>
          </aside>
        </>
      )}

      {info && (
        <div className="overlay" onClick={() => setInfo(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="x" onClick={() => setInfo(null)}>✕</button>
            <h2 style={{ marginBottom: 10 }}>{info.t}</h2>
            <p style={{ lineHeight: 1.6 }}>{info.b}</p>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Login / Signup (mobile number first, District jaisa) ---------- */
function AuthModal({ onClose, onDone }) {
  const [step, setStep] = useState('phone'); // phone | login | signup
  const [phone, setPhone] = useState('');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const validPhone = /^[6-9]\d{9}$/.test(phone);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const next = async (e) => {
    e.preventDefault();
    if (!validPhone) return;
    setErr(''); setBusy(true);
    try {
      const r = await checkPhone(phone);
      setStep(r?.exists ? 'login' : 'signup');
    } catch (ex) { setErr('Server se connect nahi hua: ' + ex.message); }
    setBusy(false);
  };

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      let res;
      if (step === 'signup') {
        await signupApi(f.name, f.email, f.password, phone);
        res = await loginApi(f.email, f.password);
      } else {
        res = await loginApi(phone, f.password);
      }
      const token = res.token || res.jwt || res.accessToken;
      if (!token) throw new Error('Token not found in response');
      localStorage.setItem('token', token);
      const user = { id: res.id, name: res.name || f.name || 'User', email: res.email || f.email, role: res.role, phone };
      localStorage.setItem('user', JSON.stringify(user));
      onDone(user);
    } catch (ex) { setErr(ex.message); }
    setBusy(false);
  };

  const phoneBadge = (
    <p className="auth-sub">
      +91 {phone} · <button type="button" className="link" onClick={() => { setStep('phone'); setErr(''); }}>Change</button>
    </p>
  );

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal auth2" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="x" onClick={onClose}>✕</button>

        <div className="auth-top">
          <div className="auth-brand">{APP_NAME}</div>
          <div className="auth-by">BY ADARSH</div>
          <p className="auth-tag">Experience the best in Movies, Shows and Bookings.</p>
        </div>

        <div className="auth-body">
          {step === 'phone' && (
            <form onSubmit={next}>
              <h2>Enter your mobile number</h2>
              <p className="auth-sub">If you don't have an account yet, we'll create one for you</p>
              <div className="phone-row">
                <div className="cc"><span className="flag" /> +91</div>
                <input type="tel" inputMode="numeric" maxLength={10} placeholder="Enter mobile number" autoFocus
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} />
              </div>
              {phone.length === 10 && !validPhone && <p className="err" style={{ marginTop: 8 }}>Sahi mobile number daalo (6-9 se shuru)</p>}
              {err && <p className="err" style={{ marginTop: 8 }}>{err}</p>}
              <button className="btn full" disabled={!validPhone || busy}>{busy ? 'Please wait…' : 'Continue'}</button>
            </form>
          )}

          {step === 'login' && (
            <form onSubmit={submit}>
              <h2>Welcome back</h2>
              {phoneBadge}
              <input type="password" placeholder="Enter your password" autoFocus
                value={f.password} onChange={set('password')} required />
              {err && <p className="err">{err}</p>}
              <button className="btn full" disabled={busy}>{busy ? 'Please wait…' : 'Login'}</button>
            </form>
          )}

          {step === 'signup' && (
            <form onSubmit={submit}>
              <h2>Create your account</h2>
              {phoneBadge}
              <input placeholder="Full name" autoFocus value={f.name} onChange={set('name')} required />
              <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
              <input type="password" placeholder="Create password" value={f.password} onChange={set('password')} required />
              {err && <p className="err">{err}</p>}
              <button className="btn full" disabled={busy}>{busy ? 'Please wait…' : 'Sign up'}</button>
            </form>
          )}

          <p className="auth-terms">
            By continuing, you agree to our<br />
            <a href="#/" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a href="#/" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Seat picker (Razorpay payment + success card) ---------- */
function SeatPicker({ movie, show, user, askLogin, onBack, toast }) {
  const [seats, setSeats] = useState([]);
  const [picked, setPicked] = useState([]);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(null);

  const reload = () => getSeats(show.id).then((r) => setSeats(r.data));
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [show.id]);

  const rows = useMemo(() => {
    const g = {};
    seats.forEach((s) => { (g[s.seat.seatNumber[0]] ||= []).push(s); });
    Object.values(g).forEach((a) => a.sort((x, y) => parseInt(x.seat.seatNumber.slice(1)) - parseInt(y.seat.seatNumber.slice(1))));
    return Object.entries(g).sort();
  }, [seats]);

  const toggle = (s) => {
    if (paying || s.status !== 'AVAILABLE') return;
    setPicked((p) => {
      if (p.includes(s.id)) return p.filter((x) => x !== s.id);
      if (p.length >= MAX_SEATS) { toast(`Max ${MAX_SEATS} seats allowed`); return p; }
      return [...p, s.id];
    });
  };
  const chosen = seats.filter((s) => picked.includes(s.id));
  const total = chosen.reduce((a, s) => a + Number(s.price), 0);

  const book = async () => {
    if (!user) return askLogin();
    setPaying(true);
    try {
      const { booking } = await payForSeats({ showId: show.id, seatIds: picked, user });
      setPicked([]);
      setDone(booking);
      toast('🎉 Payment successful! Booking confirmed');
    } catch (e) {
      toast(e.cancelled ? 'Payment cancel hua, seats release ho gayi' : 'Failed: ' + e.message);
    }
    setPaying(false);
    reload();
  };

  if (done) {
    return (
      <div className="bk-wrap">
        <div className="ok-card">
          <div className="ok-tick">✓</div>
          <h2>Booking confirmed!</h2>
          <p className="muted">Booking ID: <b>{done.bookingNumber}</b></p>
          <div className="ok-info">
            <b>{movie.title}</b>
            <span>{show.screen?.theater?.name} · {show.screen?.name}</span>
            <span>{fmt(show.startTime)}</span>
            <span>Seats: {(done.seats || []).map((s) => s.seat?.seatNumber).join(', ')}</span>
            <span>Amount paid: ₹{done.totalAmount}</span>
          </div>
          <div className="ok-actions">
            <button className="btn" onClick={() => go('/bookings')}>View My Bookings</button>
            <button className="ghost" onClick={() => { setDone(null); reload(); }}>Book more seats</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-wrap">
      <button className="link" onClick={onBack}>← Back to shows</button>
      <h3 className="mt">{movie.title}</h3>
      <p className="muted">{show.screen?.theater?.name} · {show.screen?.name} · {fmt(show.startTime)}</p>
      <div className="screen">ALL EYES THIS WAY</div>
      <div className="seatgrid">
        {rows.map(([r, list]) => (
          <div className="seatrow" key={r}><b>{r}</b>
            {list.map((s) => (
              <button key={s.id} title={`${s.seat.seatType} · ₹${s.price}`}
                className={`seat ${s.seat.seatType} ${s.status !== 'AVAILABLE' ? 'taken' : ''} ${picked.includes(s.id) ? 'picked' : ''}`}
                onClick={() => toggle(s)}>{s.seat.seatNumber.slice(1)}</button>))}
          </div>))}
      </div>
      <div className="legend">
        <span><i className="seat NORMAL" />Normal</span><span><i className="seat GOLD" />Gold</span>
        <span><i className="seat PREMIUM" />Premium</span><span><i className="seat taken" />Booked</span>
        <span><i className="seat picked" />Selected</span>
      </div>
      <div className="bar">
        <div><b>{picked.length}</b> seat(s){chosen.length > 0 && <span className="muted"> · {chosen.map((s) => s.seat.seatNumber).join(', ')}</span>}
          <div className="total">₹{total}</div></div>
        <div style={{ display: 'flex', gap: 10 }}>
          {paying && (
            <button className="ghost" onClick={async () => {
              await releasePending();
              setPaying(false); setPicked([]);
              reload();
            }}>Cancel</button>
          )}
          <button className="btn" disabled={!picked.length || paying} onClick={book}>
            {paying ? 'Processing…' : user ? 'Pay & Book' : 'Login to book'}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Movie detail page: details + dates + theaters + timings ---------- */
function BookingPage({ movie, showId, user, askLogin, toast }) {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(null);

  useEffect(() => {
    setLoading(true);
    getShows(movie.id).then((r) => { setShows(r.data); setLoading(false); });
  }, [movie.id]);

  // sirf aaj aur aage ki dates (past dates hide)
  const dates = useMemo(() => {
    const today = todayStr();
    return [...new Set(shows.map((s) => s.startTime.slice(0, 10)))]
      .filter((d) => d >= today)
      .sort();
  }, [shows]);

  useEffect(() => {
    if (date || !dates.length) return;
    const now = new Date();
    const firstLive = dates.find((d) => shows.some((s) => s.startTime.slice(0, 10) === d && new Date(s.startTime) > now));
    setDate(firstLive || dates[0]);
  }, [dates, shows, date]);

  const theaters = useMemo(() => {
    const g = {};
    shows.filter((s) => s.startTime.slice(0, 10) === date).forEach((s) => {
      const t = s.screen?.theater;
      const key = t?.name || 'Theater';
      (g[key] ||= { name: key, city: t?.city, address: t?.address, list: [] }).list.push(s);
    });
    Object.values(g).forEach((t) => t.list.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
    return Object.values(g).sort((a, b) => a.name.localeCompare(b.name));
  }, [shows, date]);

  const chosenShow = showId ? shows.find((s) => String(s.id) === String(showId)) : null;
  if (showId && loading) return <main className="bk-wrap"><p className="muted">Loading…</p></main>;
  if (chosenShow) {
    return <div><SeatPicker movie={movie} show={chosenShow} user={user} askLogin={askLogin} toast={toast}
      onBack={() => go(`/movie/${movie.id}`)} /></div>;
  }

  const now = new Date();
  const rate = rateOf(movie);
  return (
    <div className="bk-wrap">
      <button className="link" onClick={() => go('/')}>← All movies</button>

      <section className="detail">
        <Poster m={movie} className="dposter" />
        <div className="dinfo">
          <h1>{movie.title}</h1>
          <div className="tags">
            {rate && <span className="star">★ {rate}/10</span>}
            {movie.certificate && <span>{movie.certificate}</span>}
            {movie.language && <span>{movie.language}</span>}
            {movie.genre && <span>{genreText(movie)}</span>}
            {movie.durationMins ? <span>{fmtDur(movie.durationMins)}</span> : null}
          </div>
          <div className="dfacts">
            {movie.releaseDate && <span>Release date: <b>{fmtDate(movie.releaseDate)}</b></span>}
            {movie.durationMins ? <span>Runtime: <b>{movie.durationMins} min</b></span> : null}
            {movie.language && <span>Language: <b>{movie.language}</b></span>}
          </div>
          <p className="ddesc">{movie.description || 'Is movie ka description jald hi add hoga.'}</p>
          {movie.trailerUrl && <a className="trailer" href={movie.trailerUrl} target="_blank" rel="noreferrer">▶ Watch trailer</a>}
        </div>
      </section>

      <h2 className="bk-title">Select date & show</h2>
      {loading ? <p className="muted">Loading shows…</p> : dates.length === 0 ? <p className="muted">Is movie ke liye abhi koi show scheduled nahi hai.</p> : (
        <>
          <div className="bk-dates">
            {dates.map((d) => {
              const dt = new Date(d + 'T00:00:00');
              return (
                <button key={d} className={`bk-date ${d === date ? 'on' : ''}`} onClick={() => setDate(d)}>
                  <small>{dt.toLocaleDateString([], { weekday: 'short' })}</small>
                  <b>{dt.getDate()}</b>
                  <small>{dt.toLocaleDateString([], { month: 'short' })}</small>
                </button>
              );
            })}
          </div>

          {theaters.length === 0 && <p className="muted">Is date par koi show nahi hai.</p>}
          {theaters.map((t) => (
            <div className="bk-theater" key={t.name}>
              <div className="bk-th-head">
                <b>🎬 {t.name}</b>{t.city && <span className="muted"> · {t.city}</span>}
                {t.address && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{t.address}</div>}
              </div>
              <div className="bk-times">
                {t.list.map((s) => {
                  const past = new Date(s.startTime) < now;
                  return (
                    <button key={s.id} className={`bk-time ${past ? 'past' : ''}`} disabled={past}
                      onClick={() => go(`/movie/${movie.id}/show/${s.id}`)}>
                      {fmtTime(s.startTime)}<small>{s.screen?.name}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ---------- My Bookings ---------- */
function MyBookings({ user, askLogin }) {
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState('CONFIRMED');

  useEffect(() => {
    if (!user) return;
    getMyBookings().then((r) => {
      if (!r.live) { setFailed(true); setItems([]); return; }
      setItems([...r.data].sort((a, b) => b.id - a.id));
    });
  }, [user]);

  if (!user) {
    return (
      <div className="bk-wrap">
        <h1>My Bookings</h1>
        <p className="muted">Apni bookings dekhne ke liye login karo.</p>
        <button className="btn" onClick={askLogin}>Login</button>
      </div>
    );
  }

  const confirmed = (items || []).filter((b) => b.status === 'CONFIRMED').length;
  const shown = (items || []).filter((b) => tab === 'ALL' || b.status === tab);

  return (
    <div className="bk-wrap">
      <button className="link" onClick={() => go('/')}>← All movies</button>
      <h1 style={{ margin: '14px 0 4px' }}>My Bookings</h1>
      <p className="muted">{confirmed} confirmed booking{confirmed === 1 ? '' : 's'}</p>

      <div className="mb-tabs">
        {[['CONFIRMED', 'Confirmed'], ['CANCELLED', 'Cancelled'], ['ALL', 'All']].map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {items === null ? <p className="muted">Loading…</p>
        : failed ? <p className="err">Bookings load nahi hui. Backend (8081) chal raha hai?</p>
        : shown.length === 0 ? <p className="muted">Koi booking nahi mili.</p>
        : shown.map((b) => {
          const mv = b.show?.movie;
          return (
            <div className="mb-card" key={b.id}>
              {mv && <Poster m={mv} className="mbposter" />}
              <div className="mb-body">
                <div className="mb-top">
                  <h3>{mv?.title}</h3>
                  <span className={`mb-status ${b.status}`}>{b.status}</span>
                </div>
                <p className="muted">{b.show?.screen?.theater?.name}{b.show?.screen?.theater?.city ? `, ${b.show.screen.theater.city}` : ''} · {b.show?.screen?.name}</p>
                <p>{b.show?.startTime && fmt(b.show.startTime)}</p>
                <p>Seats: <b>{(b.seats || []).map((s) => s.seat?.seatNumber).join(', ') || '—'}</b></p>
                <p className="muted">₹{b.totalAmount} · ID: {b.bookingNumber}</p>
              </div>
            </div>
          );
        })}
    </div>
  );
}

/* ---------- App ---------- */
export default function App() {
  const parts = useRoute();
  const [movies, setMovies] = useState([]);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [lang, setLang] = useState('All');
  const [showAuth, setShowAuth] = useState(false);
  const [msg, setMsg] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const cols = useCols();
  const [showAll, setShowAll] = useState(false);
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });

  useEffect(() => { getMovies().then((r) => { setMovies(r.data); setLive(r.live); setLoading(false); }); }, []);
  useEffect(() => { document.title = `${APP_NAME} by Adarsh`; }, []);
  const toast = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3500); };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); toast('Logged out'); };

  const heroMovies = useMemo(() => {
    const withPoster = movies.filter(hasPoster);
    const withDesc = withPoster.filter((m) => m.description);
    return (withDesc.length >= 3 ? withDesc : withPoster.length ? withPoster : movies).slice(0, 6);
  }, [movies]);

  const chipList = useMemo(() => {
    const count = {};
    movies.forEach((m) => { if (m.language) count[m.language] = (count[m.language] || 0) + 1; });
    const langs = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 8);
    return ['All', ...(movies.some(isRecent) ? ['New Releases'] : []), ...langs];
  }, [movies]);

  const list = movies.filter((m) => {
    const okLang = lang === 'All' || (lang === 'New Releases' ? isRecent(m) : m.language === lang);
    return okLang && m.title.toLowerCase().includes(q.toLowerCase());
  });
  const visible = showAll ? list : list.slice(0, cols * 2);

  const isBookings = parts[0] === 'bookings';
  const isMoviePage = parts[0] === 'movie';
  const movie = isMoviePage ? movies.find((m) => String(m.id) === parts[1]) : null;
  const showId = parts[2] === 'show' ? parts[3] : null;

  return (
    <>
      <nav>
        <div className="nav-left">
          <div className="brand" onClick={() => go('/')}>
            <Logo />
            <div className="brand-txt"><b>{APP_NAME}</b><small>by Adarsh</small></div>
          </div>
          <div className="city"><span>📍</span><div><b>Delhi NCR</b><small>India</small></div></div>
        </div>

        <div className="tabs">
          <button className={`tab ${!isBookings ? 'on' : ''}`} onClick={() => go('/')}>Movies</button>
          {user && <button className={`tab ${isBookings ? 'on' : ''}`} onClick={() => go('/bookings')}>My Bookings</button>}
        </div>

        <div className="nav-right">
          {searchOpen ? (
            <div className="search-wrap open">
              <span className="search-ico">🔍</span>
              <input
                className="search"
                placeholder="Search for movies…"
                value={q}
                autoFocus
                onChange={(e) => { setQ(e.target.value); if (parts.length) go('/'); }}
                onKeyDown={(e) => { if (e.key === 'Escape') { setQ(''); setSearchOpen(false); } }}
              />
              <button className="search-x" aria-label="Close search" onClick={() => { setQ(''); setSearchOpen(false); }}>✕</button>
            </div>
          ) : (
            <button className="search-btn" aria-label="Search" onClick={() => setSearchOpen(true)}>🔍</button>
          )}
          <ProfileMenu user={user} onLogin={() => setShowAuth(true)} onLogout={logout} />
        </div>
      </nav>

      {!live && <div className="warn">⚠️ Backend (port 8081) not reachable. Showing demo data.</div>}

      {isBookings ? (
        <MyBookings user={user} askLogin={() => setShowAuth(true)} />
      ) : isMoviePage ? (
        loading ? <div className="bk-wrap"><p className="muted">Loading…</p></div>
        : movie ? <BookingPage key={movie.id} movie={movie} showId={showId} user={user} toast={toast} askLogin={() => setShowAuth(true)} />
        : <div className="bk-wrap"><p className="muted">Movie nahi mili.</p><button className="link" onClick={() => go('/')}>← All movies</button></div>
      ) : (
        <>
          {!q && <Carousel movies={heroMovies} onBook={(m) => go(`/movie/${m.id}`)} />}
          <main>
            <h2 className="sec">{q ? `Results for “${q}”` : 'All movies'}</h2>
            <div className="chips">{chipList.map((l) => <button key={l} className={l === lang ? 'on' : ''} onClick={() => setLang(l)}>{l}</button>)}</div>
            {loading ? <p className="muted">Loading movies…</p> : list.length === 0 ? <p className="muted">Koi movie nahi mili.</p> : (
              <>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                  {visible.map((m) => (
                    <div className="card" key={m.id} onClick={() => go(`/movie/${m.id}`)}>
                      <div className="pwrap">
                        <Poster m={m} />
                        {rateOf(m) && <span className="rate">★ {rateOf(m)}</span>}
                      </div>
                      <div className="card-body">
                        <h4>{m.title}</h4>
                        <p>{certLang(m)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {list.length > cols * 2 && (
                  <div className="see-all-wrap">
                    <button className="see-all" onClick={() => setShowAll(!showAll)}>
                      {showAll ? 'Show less ↑' : `See all movies (${list.length}) →`}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </>
      )}

      <ChatWidget movies={movies} />

      <footer className="site-footer">
        <div className="ft-in">
          <div className="ft-brand">
            <div className="ft-logo"><Logo size={34} /><b>{APP_NAME}</b></div>
            <small>by Adarsh</small>
            <div className="ft-social">
              <a href="https://www.linkedin.com/in/adarsh-singh-backend/" target="_blank" rel="noreferrer">LinkedIn</a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://github.com/GitadarshSingh/marquee-movie-booking.git" target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </div>

          <div className="ft-col">
            <h5>Help</h5>
            <a href="tel:+919554620412">Contact Us</a>
            <a href="#/" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('open-chat')); }}>Chat with us</a>
          </div>

          <div className="ft-col">
            <h5>Quick Links</h5>
            <a href="#/" onClick={(e) => { e.preventDefault(); go('/'); }}>Movies</a>
            {user && <a href="#/bookings" onClick={(e) => { e.preventDefault(); go('/bookings'); }}>My Bookings</a>}
          </div>

          <div className="ft-card">
            <h5>Contact</h5>
            <a href="tel:+919554620412">📞 +91 9554620412</a>
            <a href="https://www.linkedin.com/in/adarsh-singh-backend/" target="_blank" rel="noreferrer">💼 LinkedIn</a>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">📷 Instagram</a>
            <a href="https://github.com/GitadarshSingh/marquee-movie-booking.git" target="_blank" rel="noreferrer">💻 GitHub repo</a>
          </div>
        </div>
        <div className="ft-copy">© {new Date().getFullYear()} {APP_NAME} by Adarsh · Built with React + Spring Boot</div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onDone={(u) => { setUser(u); setShowAuth(false); toast('Welcome, ' + u.name + '!'); }} />}
      {msg && <div className="toast">{msg}</div>}
    </>
  );
}