import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSeatsByShowId } from "../services/showSeatService";
import "../styles/SeatSelection.css";

const CATEGORY_ORDER = ["GOLD", "PREMIUM", "NORMAL"];
const CATEGORY_LABELS = {
  GOLD: "Gold",
  PREMIUM: "Premium",
  NORMAL: "Normal",
};

function groupSeats(seats) {
  // group by category -> row letter -> seats[]
  const categories = {};

  seats.forEach((s) => {
    const type = s.seat.seatType;
    const seatNumber = s.seat.seatNumber; // e.g. "G1"
    const rowLetter = seatNumber.match(/^[A-Za-z]+/)[0];
    const colNumber = parseInt(seatNumber.match(/\d+/)[0], 10);

    if (!categories[type]) categories[type] = {};
    if (!categories[type][rowLetter]) categories[type][rowLetter] = [];

    categories[type][rowLetter].push({ ...s, colNumber });
  });

  // sort seats within each row by column number
  Object.values(categories).forEach((rows) => {
    Object.values(rows).forEach((rowSeats) => {
      rowSeats.sort((a, b) => a.colNumber - b.colNumber);
    });
  });

  return categories;
}

function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeats();
  }, []);

  const loadSeats = async () => {
    try {
      setLoading(true);
      const data = await getSeatsByShowId(showId);
      setSeats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status !== "AVAILABLE") return;

    const exists = selectedSeats.find((s) => s.id === seat.id);

    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const grouped = groupSeats(seats);
  const categoriesPresent = CATEGORY_ORDER.filter((c) => grouped[c]);

  if (loading) {
    return (
      <div className="seat-loading">
        <div className="seat-spinner"></div>
        <p>Loading seats...</p>
      </div>
    );
  }

  return (
    <div className="seat-page">
      {/* Header */}
      <div className="seat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <div className="movie-title-header">Select Seats</div>
          <div className="show-meta">
            <span className="show-screen">Show ID: {showId}</span>
          </div>
        </div>
      </div>

      {/* Seat map */}
      <div className="seat-map-wrapper">
        <div className="seat-map">
          {categoriesPresent.map((category, catIdx) => {
            const rows = grouped[category];
            const rowLetters = Object.keys(rows).sort();
            // price comes from any seat in this category
            const samplePrice = rows[rowLetters[0]][0].price;

            return (
              <div key={category} style={{ width: "100%" }}>
                <div className="seat-category">
                  <div className="category-label">
                    {CATEGORY_LABELS[category] || category}{" "}
                    <span>₹{samplePrice}</span>
                  </div>

                  {rowLetters
                    .sort((a, b) => b.localeCompare(a)) // back rows first (like cinema layout)
                    .map((rowLetter) => (
                      <div className="seat-row" key={rowLetter}>
                        <div className="row-label">{rowLetter}</div>
                        <div className="seats-in-row">
                          {rows[rowLetter].map((seat) => {
                            const isSelected = selectedSeats.find(
                              (s) => s.id === seat.id
                            );
                            const statusClass =
                              seat.status === "AVAILABLE"
                                ? isSelected
                                  ? "selected"
                                  : "available"
                                : seat.status === "LOCKED"
                                ? "locked"
                                : "booked";

                            return (
                              <button
                                key={seat.id}
                                className={`seat ${statusClass}`}
                                onClick={() => handleSeatClick(seat)}
                                disabled={seat.status !== "AVAILABLE"}
                                title={seat.seat.seatNumber}
                              >
                                {seat.colNumber}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>

                {catIdx < categoriesPresent.length - 1 && (
                  <div className="category-divider"></div>
                )}
              </div>
            );
          })}

          {/* Screen indicator */}
          <div className="screen-indicator">
            <div className="screen-curve"></div>
            <div className="screen-text">Screen this way</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-box available"></div>
          Available
        </div>
        <div className="legend-item">
          <div className="legend-box selected"></div>
          Selected
        </div>
        <div className="legend-item">
          <div className="legend-box booked"></div>
          Booked
        </div>
      </div>

      {/* Bottom bar */}
      {selectedSeats.length > 0 && (
        <div className="bottom-bar">
          <div className="bottom-bar-info">
            <div className="selected-seat-numbers">
              {selectedSeats.map((s) => s.seat.seatNumber).join(", ")}
            </div>
            <div className="total-amount">₹{totalAmount}</div>
          </div>
          <button
            className="pay-btn"
            onClick={() =>
              navigate("/payment", {
                state: {
                  selectedSeats,
                  totalAmount,
                  showId,
                  seatIds: selectedSeats.map((seat) => seat.id),
                },
              })
            }
          >
            Proceed to Pay
          </button>
        </div>
      )}
    </div>
  );
}

export default SeatSelection;
