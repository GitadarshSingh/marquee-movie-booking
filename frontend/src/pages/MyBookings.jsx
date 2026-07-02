import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserBookings, cancelBooking } from "../services/bookingService";

const FILTERS = ["All", "Confirmed", "Cancelled"];
const HIDDEN_KEY = "hiddenBookingIds";

function getHiddenIds() {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHiddenIds(ids) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids));
}

function formatShowDateTime(startTime) {
  if (!startTime) return null;
  const d = new Date(startTime);
  const date = d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [cancellingId, setCancellingId] = useState(null);
  const [hiddenIds, setHiddenIds] = useState(getHiddenIds());

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getUserBookings(1); // userId = 1
      setBookings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking? This action cannot be undone.")) return;
    try {
      setCancellingId(id);
      await cancelBooking(id);
      await loadBookings();
    } catch (error) {
      console.error(error);
    } finally {
      setCancellingId(null);
    }
  };

  const handleRemoveFromList = (id) => {
    if (!window.confirm("Remove this booking from your list? It will only be hidden from this view.")) return;
    const updated = [...hiddenIds, id];
    setHiddenIds(updated);
    saveHiddenIds(updated);
  };

  const visibleBookings = bookings.filter((b) => !hiddenIds.includes(b.id));

  const filteredBookings = visibleBookings.filter((b) => {
    if (filter === "All") return true;
    if (filter === "Confirmed") return b.status === "CONFIRMED";
    if (filter === "Cancelled") return b.status === "CANCELLED";
    return true;
  });

  const formatSeats = (booking) => {
    const seats = booking.seats?.map((s) => s.seat?.seatNumber).filter(Boolean);
    return seats && seats.length > 0 ? seats.join(", ") : "—";
  };

  const counts = {
    All: visibleBookings.length,
    Confirmed: visibleBookings.filter((b) => b.status === "CONFIRMED").length,
    Cancelled: visibleBookings.filter((b) => b.status === "CANCELLED").length,
  };

  if (loading) {
    return (
      <div style={styles.statusWrap}>
        <div style={styles.spinner} />
        <p style={styles.statusText}>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>My Bookings</h1>
            <p style={styles.subtitle}>
              {visibleBookings.length} booking{visibleBookings.length !== 1 ? "s" : ""} · {counts.Confirmed} active
            </p>
          </div>
          <button style={styles.refreshBtn} onClick={loadBookings}>
            <span style={styles.refreshIcon}>⟳</span> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={styles.filterRow}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterChip,
                ...(filter === f ? styles.filterChipActive : {}),
              }}
            >
              {f}
              <span
                style={{
                  ...styles.filterCount,
                  ...(filter === f ? styles.filterCountActive : {}),
                }}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <div style={styles.emptyWrap}>
            <div style={styles.emptyIcon}>🎬</div>
            <p style={styles.emptyText}>
              {filter === "All"
                ? "You haven't booked any tickets yet."
                : `No ${filter.toLowerCase()} bookings.`}
            </p>
            <button style={styles.browseBtn} onClick={() => navigate("/")}>
              Browse Movies
            </button>
          </div>
        ) : (
          <div style={styles.bookingList}>
            {filteredBookings.map((booking) => {
              const isConfirmed = booking.status === "CONFIRMED";
              const showDateTime = formatShowDateTime(booking.show?.startTime);
              const theaterName = booking.show?.screen?.theater?.name;

              return (
                <div key={booking.id} style={styles.card}>
                  <div style={styles.cardMain}>
                    {/* Poster / placeholder */}
                    <div style={styles.poster}>
                      {booking.show?.movie?.posterUrl ? (
                        <img
                          src={booking.show.movie.posterUrl}
                          alt={booking.show?.movie?.title}
                          style={styles.posterImg}
                        />
                      ) : (
                        <span style={styles.posterFallback}>🎞️</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={styles.infoCol}>
                      <div style={styles.cardTop}>
                        <h3 style={styles.movieTitle}>
                          {booking.show?.movie?.title || "Untitled"}
                        </h3>
                        <div style={styles.cardTopRight}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(isConfirmed
                                ? styles.statusConfirmed
                                : styles.statusCancelled),
                            }}
                          >
                            {isConfirmed ? "● Confirmed" : "● Cancelled"}
                          </span>
                          {!isConfirmed && (
                            <button
                              style={styles.removeBtn}
                              title="Remove from list"
                              onClick={() => handleRemoveFromList(booking.id)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {(showDateTime || theaterName) && (
                        <p style={styles.showMeta}>
                          {showDateTime}
                          {showDateTime && theaterName ? "  ·  " : ""}
                          {theaterName}
                        </p>
                      )}

                      <p style={styles.bookingNumber}>
                        Booking #{booking.bookingNumber}
                      </p>

                      <div style={styles.detailsRow}>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Seats</span>
                          <span style={styles.detailValue}>
                            {formatSeats(booking)}
                          </span>
                        </div>
                        <div style={styles.detailDividerV} />
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Amount</span>
                          <span style={styles.detailValue}>
                            ₹{booking.totalAmount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isConfirmed && (
                    <>
                      <div style={styles.ticketDivider}>
                        <div style={styles.notchLeft} />
                        <div style={styles.dashedLine} />
                        <div style={styles.notchRight} />
                      </div>
                      <div style={styles.cardActions}>
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          style={{
                            ...styles.cancelBtn,
                            ...(cancellingId === booking.id
                              ? styles.cancelBtnDisabled
                              : {}),
                          }}
                        >
                          {cancellingId === booking.id
                            ? "Cancelling..."
                            : "Cancel Booking"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fafafa",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: "40px 20px 60px",
  },
  container: {
    maxWidth: "760px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#111",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "13px",
    color: "#999",
    margin: "6px 0 0",
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#fff",
    border: "1.5px solid #e5e5e5",
    color: "#1a1a1a",
    fontSize: "13px",
    fontWeight: 600,
    padding: "9px 18px",
    borderRadius: "22px",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  refreshIcon: {
    fontSize: "14px",
  },
  filterRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "28px",
  },
  filterChip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "22px",
    border: "1.5px solid #e5e5e5",
    backgroundColor: "#fff",
    color: "#666",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  filterChipActive: {
    backgroundColor: "#111",
    borderColor: "#111",
    color: "#fff",
  },
  filterCount: {
    fontSize: "11px",
    fontWeight: 700,
    backgroundColor: "#f0f0f0",
    color: "#888",
    borderRadius: "10px",
    padding: "1px 7px",
  },
  filterCountActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    color: "#fff",
  },
  bookingList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #eee",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    transition: "box-shadow 0.2s ease",
  },
  cardMain: {
    display: "flex",
    gap: "18px",
    padding: "20px 22px",
  },
  poster: {
    width: "64px",
    height: "92px",
    borderRadius: "10px",
    backgroundColor: "#f3f0fb",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  posterImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  posterFallback: {
    fontSize: "26px",
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },
  cardTopRight: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  },
  movieTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#111",
    margin: 0,
    lineHeight: 1.3,
  },
  statusBadge: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
  },
  statusConfirmed: {
    color: "#16a34a",
    backgroundColor: "#eafbf0",
  },
  statusCancelled: {
    color: "#dc2626",
    backgroundColor: "#fdeeee",
  },
  removeBtn: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    border: "1px solid #e5e5e5",
    background: "#fff",
    color: "#999",
    fontSize: "11px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    lineHeight: 1,
  },
  showMeta: {
    fontSize: "13px",
    color: "#666",
    margin: "6px 0 0",
    fontWeight: 500,
  },
  bookingNumber: {
    fontSize: "12px",
    color: "#bbb",
    margin: "4px 0 0",
    fontFamily: "monospace",
  },
  detailsRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginTop: "14px",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  detailDividerV: {
    width: "1px",
    height: "26px",
    backgroundColor: "#eee",
  },
  detailLabel: {
    fontSize: "10px",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 700,
  },
  detailValue: {
    fontSize: "14px",
    color: "#111",
    fontWeight: 700,
  },
  ticketDivider: {
    display: "flex",
    alignItems: "center",
    position: "relative",
    height: "1px",
  },
  notchLeft: {
    position: "absolute",
    left: "-10px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "#fafafa",
  },
  notchRight: {
    position: "absolute",
    right: "-10px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "#fafafa",
  },
  dashedLine: {
    width: "100%",
    borderTop: "1.5px dashed #e5e5e5",
  },
  cardActions: {
    padding: "14px 22px",
    display: "flex",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    background: "#fff",
    color: "#dc2626",
    border: "1.5px solid #f5c6c6",
    padding: "9px 20px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
  },
  cancelBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  emptyWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "90px 24px",
    gap: "10px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    border: "1px solid #eee",
  },
  emptyIcon: {
    fontSize: "46px",
  },
  emptyText: {
    color: "#999",
    fontSize: "14px",
    margin: 0,
    textAlign: "center",
  },
  browseBtn: {
    marginTop: "12px",
    background: "#111",
    color: "#fff",
    border: "none",
    padding: "11px 26px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
  },
  statusWrap: {
    minHeight: "100vh",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
  },
  statusText: {
    color: "#888",
    fontSize: "14px",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #eee",
    borderTop: "3px solid #111",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

export default MyBookings;