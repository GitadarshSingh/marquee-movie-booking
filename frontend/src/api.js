// ====== Spring Boot URLs ======
// Khali = same origin (local par Vite proxy, Docker par nginx proxy /api ko backend bhejta hai)
const BASE = import.meta.env.VITE_API_URL || '';

// Razorpay Key ID public hoti hai (Key Secret yahan kabhi mat daalna).
// Fallback mein apni asli Test Key ID likho (jo backend ki razorpay.key.id hai).
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TwohdPafUZC4ge';

const EP = {
  login: `${BASE}/api/auth/login`,
  signup: `${BASE}/api/auth/signup`,
  checkPhone: `${BASE}/api/auth/check-phone`,
  movies: `${BASE}/api/movies`,
  shows: (movieId) => `${BASE}/api/shows/movie/${movieId}`,
  seats: (showId) => `${BASE}/api/show-seats/show/${showId}`,
  book: `${BASE}/api/bookings`,
  userBookings: (userId) => `${BASE}/api/bookings/user/${userId}`,
  cancel: (id) => `${BASE}/api/bookings/${id}/cancel`,
  payCreate: `${BASE}/api/payments/create-orders`,
  payUpdate: `${BASE}/api/payments/update-orders`,
  payFailed: `${BASE}/api/payments/payment-failed`,
  aiChat: `${BASE}/api/ai/chat`,
};

const authHeaders = () => {
  const t = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

// response ko safely parse karta hai (JSON ya plain text)
async function parse(r) {
  const text = await r.text();
  if (!r.ok) throw new Error(text || `HTTP ${r.status}`);
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function req(url, opt = {}) {
  const r = await fetch(url, { ...opt, headers: { ...authHeaders(), ...(opt.headers || {}) } });
  return parse(r);
}

// bina token ke POST (login / signup)
async function post(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parse(r);
}

// ---------- demo data (sirf jab backend band ho) ----------
const names = ['Chhaava','Saiyaara','War 2','Dhurandhar','Pushpa 2','Kalki 2898 AD','Coolie','Kantara','Dune: Part Two','Avatar: Fire and Ash','Zootopia 2','Wicked: For Good'];
const langs = ['Hindi','Hindi','Hindi','Hindi','Telugu','Telugu','Tamil','Kannada','English','English','English','English'];
const DEMO_MOVIES = names.map((title, i) => ({
  id: i + 1, title, language: langs[i], genre: 'Action/Drama',
  durationMins: 130 + i * 6, releaseDate: '2025-0' + ((i % 9) + 1) + '-15', posterUrl: '',
}));
const DEMO_SHOWS = (id) => ['10:00', '13:30', '18:00', '21:30'].map((t, i) => ({
  id: id * 10 + i, startTime: `2026-11-07T${t}:00`,
  screen: { name: 'Audi ' + ((i % 3) + 1), theater: { name: i % 2 ? 'INOX Mall of India' : 'PVR Ambience Mall', city: i % 2 ? 'Noida' : 'Gurugram' } },
}));
const DEMO_SEATS = () => 'ABCDEFGHIJ'.split('').flatMap((r, ri) => Array.from({ length: 12 }, (_, n) => ({
  id: ri * 12 + n + 1, status: Math.random() < 0.2 ? 'BOOKED' : 'AVAILABLE', price: ri < 4 ? 150 : ri < 8 ? 250 : 400,
  seat: { seatNumber: r + (n + 1), seatType: ri < 4 ? 'NORMAL' : ri < 8 ? 'GOLD' : 'PREMIUM' },
})));

// live: true = backend se aaya, live: false = demo data
const safe = async (fn, fallback) => {
  try {
    return { data: await fn(), live: true };
  } catch (e) {
    console.error('API FAIL:', e.message);
    return { data: fallback, live: false };
  }
};

// logged-in user ki id: localStorage 'user' -> 'userId' -> JWT token
const idFromToken = () => {
  try {
    const t = localStorage.getItem('token');
    if (!t) return null;
    const b64 = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(b64));
    const id = p.id ?? p.userId ?? p.uid ?? null;
    return id != null ? Number(id) : null;
  } catch { return null; }
};

const getUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (u && u.id != null) return Number(u.id);
  } catch { /* ignore */ }
  const id = localStorage.getItem('userId');
  if (id) return Number(id);
  return idFromToken();
};

// ---------- read APIs ----------
export const getMovies = () => safe(() => req(EP.movies), DEMO_MOVIES);
export const getShows = (id) => safe(() => req(EP.shows(id)), DEMO_SHOWS(id));
export const getSeats = (id) => safe(() => req(EP.seats(id)), DEMO_SEATS());
export const getMyBookings = (userId = getUserId()) => safe(() => req(EP.userBookings(userId)), []);

// ---------- auth ----------
export const checkPhone = async (phone) => {
  const r = await fetch(`${EP.checkPhone}?phone=${encodeURIComponent(phone)}`);
  return parse(r);
};

export const loginApi = (emailOrPhone, password) => post(EP.login, { email: emailOrPhone, password });
export const signupApi = (name, email, password, phoneNumber) =>
  post(EP.signup, { name, email, password, phoneNumber });

// ---------- AI chat ----------
export const askAI = (message) =>
  req(EP.aiChat, { method: 'POST', body: JSON.stringify({ message }) });

// ---------- booking (status PENDING, seats LOCKED) ----------
export const bookSeats = (showId, ids, paymentMethod = 'RAZORPAY') =>
  req(EP.book, {
    method: 'POST',
    body: JSON.stringify({ userId: getUserId(), showId, seatIds: ids, paymentMethod }),
  });

export const cancelBooking = (id) => req(EP.cancel(id), { method: 'PUT' });

// ---------- payment (Razorpay) ----------
export const createPaymentOrder = (request) =>
  req(EP.payCreate, { method: 'POST', body: JSON.stringify(request) });

export const confirmPayment = (orderId, paymentId, signature) => {
  const q = new URLSearchParams({ orderId, paymentId, signature }).toString();
  return req(`${EP.payUpdate}?${q}`, { method: 'POST' });
};

export const paymentFailed = (orderId) =>
  req(`${EP.payFailed}?${new URLSearchParams({ orderId }).toString()}`, { method: 'POST' });

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error('Razorpay load nahi hua, internet check karo'));
    document.body.appendChild(s);
  });
}

// adhoori payment ka record, taaki cancel par seats release ho sakein
let pending = null; // { bookingId, orderId }
let activeRzp = null;

export async function releasePending() {
  try { activeRzp?.close(); } catch { /* ignore */ }
  activeRzp = null;
  if (!pending) return;
  const p = pending;
  pending = null;
  try {
    if (!p.orderId) throw new Error('no order');
    await paymentFailed(p.orderId);
  } catch {
    await cancelBooking(p.bookingId).catch(() => {});
  }
}

/**
 * Flow: booking (PENDING) -> Razorpay order -> popup -> verify -> CONFIRMED
 * Success par { booking } milta hai. Cancel par error.cancelled = true.
 */
export async function payForSeats({ showId, seatIds, user }) {
  await loadRazorpay();

  const booking = await bookSeats(showId, seatIds);
  pending = { bookingId: booking.id, orderId: null };

  let order;
  try {
    order = await createPaymentOrder({
      bookingId: booking.id,
      amount: booking.totalAmount,
      name: booking.user?.name || user?.name || 'Customer',
      email: booking.user?.email || user?.email || '',
    });
    pending.orderId = order.id;
  } catch (e) {
    await releasePending();
    throw e;
  }

  return new Promise((resolve, reject) => {
    let paid = false;
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: 'Marquee by Adarsh',
      description: booking.show?.movie?.title || 'Movie tickets',
      prefill: {
        name: booking.user?.name || user?.name || '',
        email: booking.user?.email || user?.email || '',
      },
      theme: { color: '#5b3df5' },
      handler: async (resp) => {
        paid = true;
        try {
          await confirmPayment(resp.razorpay_order_id, resp.razorpay_payment_id, resp.razorpay_signature);
          pending = null;
          activeRzp = null;
          resolve({ booking });
        } catch (e) {
          reject(new Error('Payment hua par confirm nahi hua: ' + e.message));
        }
      },
      modal: {
        ondismiss: async () => {
          if (paid) return;
          await releasePending();
          const err = new Error('Payment cancelled');
          err.cancelled = true;
          reject(err);
        },
      },
    });
    activeRzp = rzp;
    rzp.open();
  });
}