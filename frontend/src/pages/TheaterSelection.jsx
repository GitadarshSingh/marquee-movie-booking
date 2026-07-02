import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAllTheaters } from "../services/theaterService";
import { getShowsByMovieId } from "../services/showService";

function getNextDays(count = 7) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameDate(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function TheaterSelection() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [theaters, setTheaters] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = getNextDays(7);
  const [selectedDate, setSelectedDate] = useState(days[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [theaterData, showData] = await Promise.all([
        getAllTheaters(),
        getShowsByMovieId(id),
      ]);
      setTheaters(theaterData);
      setShows(showData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showsByTheater = {};
  shows
    .filter((show) => isSameDate(new Date(show.startTime), selectedDate))
    .forEach((show) => {
      const theaterId = show.screen?.theater?.id;
      if (!theaterId) return;
      if (!showsByTheater[theaterId]) showsByTheater[theaterId] = [];
      showsByTheater[theaterId].push(show);
    });

  const visibleTheaters = theaters.filter(
    (theater) => showsByTheater[theater.id]?.length > 0
  );

  return (
    <div style={styles.page}>
      {/* Date Strip */}
      <div style={styles.dateStrip}>
        {days.map((day, idx) => {
          const isSelected = isSameDate(day, selectedDate);
          const showMonthLabel =
            idx === 0 || day.getDate() === 1;
          return (
            <div key={idx} style={styles.dateItem}>
              {showMonthLabel && (
                <div style={styles.monthLabel}>
                  {MONTHS[day.getMonth()].toUpperCase()}
                </div>
              )}
              <button
                onClick={() => setSelectedDate(day)}
                style={{
                  ...styles.datePill,
                  ...(isSelected ? styles.datePillActive : {}),
                }}
              >
                <span style={styles.dateNum}>{day.getDate()}</span>
                <span style={styles.dateDay}>{WEEKDAYS[day.getDay()]}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div style={styles.divider} />

      {/* Filter chips — visual only, matching District style */}
      <div style={styles.filterRow}>
        <button style={styles.filterChip}>
          <span style={styles.filterIcon}>⚙</span> Filters
        </button>
        {["Recliners", "Wheelchair Friendly", "Premium Seats"].map((f) => (
          <button key={f} style={styles.filterChip}>{f}</button>
        ))}
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <span style={styles.legendDot("#4ade80")} />
        <span style={styles.legendText}>Available</span>
        <span style={styles.legendDot("#f59e0b")} />
        <span style={styles.legendText}>Filling fast</span>
        <span style={styles.legendDot("#ef4444")} />
        <span style={styles.legendText}>Almost full</span>
      </div>

      {/* Theater List */}
      {loading ? (
        <div style={styles.statusWrap}>
          <div style={styles.spinner} />
          <p style={styles.statusText}>Loading showtimes...</p>
        </div>
      ) : visibleTheaters.length === 0 ? (
        <div style={styles.statusWrap}>
          <div style={styles.emptyIcon}>🎬</div>
          <p style={styles.statusText}>No shows available for this date.</p>
          <p style={styles.statusSub}>Try selecting a different date above.</p>
        </div>
      ) : (
        <div style={styles.theaterList}>
          {visibleTheaters.map((theater) => (
            <div key={theater.id} style={styles.theaterCard}>
              {/* Theater Info */}
              <div style={styles.theaterLeft}>
                <div style={styles.theaterLogo}>
                  {theater.name.charAt(0)}
                </div>
                <div>
                  <h2 style={styles.theaterName}>{theater.name}</h2>
                  {theater.address && (
                    <p style={styles.theaterAddress}>{theater.address}</p>
                  )}
                  {theater.city && (
                    <p style={styles.theaterCity}>{theater.city}</p>
                  )}
                  <div style={styles.theaterBadges}>
                    <span style={styles.badge}>✓ Allows cancellation</span>
                  </div>
                </div>
              </div>

              {/* Showtimes Grid */}
              <div style={styles.showtimesGrid}>
                {showsByTheater[theater.id]
                  .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                  .map((show) => (
                    <button
                      key={show.id}
                      style={styles.showtimeBtn}
                      onClick={() => navigate(`/shows/${show.id}/seats`)}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "#f0fdf4";
                        e.currentTarget.style.borderColor = "#4ade80";
                        e.currentTarget.style.color = "#16a34a";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                        e.currentTarget.style.borderColor = "#d7d7d7";
                        e.currentTarget.style.color = "#1a1a1a";
                      }}
                    >
                      <span style={styles.showTime}>{formatTime(show.startTime)}</span>
                      {show.screen?.name && (
                        <span style={styles.showScreen}>{show.screen.name}</span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: "0 0 60px 0",
  },
  dateStrip: {
    display: "flex",
    alignItems: "flex-end",
    gap: "6px",
    padding: "20px 24px 0",
    overflowX: "auto",
  },
  dateItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  monthLabel: {
    fontSize: "10px",
    color: "#999",
    letterSpacing: "0.08em",
    fontWeight: 600,
    marginBottom: "4px",
  },
  datePill: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "60px",
    height: "64px",
    borderRadius: "10px",
    border: "1.5px solid #e5e5e5",
    backgroundColor: "#f5f5f7",
    color: "#1a1a1a",
    cursor: "pointer",
    transition: "all 0.15s ease",
    gap: "2px",
  },
  datePillActive: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
    color: "#ffffff",
  },
  dateNum: {
    fontSize: "20px",
    fontWeight: 700,
    lineHeight: 1,
  },
  dateDay: {
    fontSize: "11px",
    fontWeight: 500,
    opacity: 0.85,
  },
  divider: {
    height: "1px",
    backgroundColor: "#eee",
    margin: "16px 0",
  },
  filterRow: {
    display: "flex",
    gap: "10px",
    padding: "0 24px",
    flexWrap: "wrap",
  },
  filterChip: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 16px",
    borderRadius: "20px",
    border: "1.5px solid #e0d9f7",
    backgroundColor: "#f3effd",
    color: "#5b3fb0",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
  },
  filterIcon: {
    fontSize: "12px",
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "14px 24px",
    fontSize: "12px",
    color: "#666",
  },
  legendDot: (color) => ({
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: color,
    marginLeft: "8px",
  }),
  legendText: {
    color: "#555",
    fontSize: "12px",
  },
  theaterList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "0 16px",
  },
  theaterCard: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: "24px",
    backgroundColor: "#ffffff",
    border: "1px solid #eaeaea",
    borderRadius: "12px",
    padding: "20px 24px",
    marginBottom: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  theaterLeft: {
    display: "flex",
    gap: "14px",
    minWidth: "220px",
    maxWidth: "260px",
  },
  theaterLogo: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "#eaf2ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: 700,
    flexShrink: 0,
  },
  theaterName: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#1a1a1a",
    lineHeight: 1.3,
  },
  theaterAddress: {
    margin: "3px 0 0",
    fontSize: "12px",
    color: "#888",
    lineHeight: 1.4,
  },
  theaterCity: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "#999",
  },
  theaterBadges: {
    marginTop: "8px",
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  badge: {
    fontSize: "11px",
    color: "#16a34a",
    backgroundColor: "#eafbf0",
    border: "1px solid #c8f0d8",
    borderRadius: "4px",
    padding: "2px 8px",
  },
  showtimesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    flex: 1,
    alignContent: "flex-start",
  },
  showtimeBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "1.5px solid #d7d7d7",
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
    cursor: "pointer",
    transition: "all 0.15s ease",
    minWidth: "110px",
  },
  showTime: {
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  showScreen: {
    fontSize: "11px",
    color: "#999",
    marginTop: "3px",
    fontWeight: 400,
  },
  statusWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    gap: "12px",
  },
  emptyIcon: {
    fontSize: "48px",
  },
  statusText: {
    color: "#666",
    fontSize: "15px",
    margin: 0,
  },
  statusSub: {
    color: "#999",
    fontSize: "13px",
    margin: 0,
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #eee",
    borderTop: "3px solid #1a1a1a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

export default TheaterSelection;