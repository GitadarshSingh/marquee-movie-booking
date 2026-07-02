import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createBooking } from "../services/bookingService";
import { createOrder, updateOrderStatus, paymentFailed } from "../services/paymentService";
import { getShowById } from "../services/showService";
import "../styles/PaymentPage.css";

function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    selectedSeats = [],
    totalAmount = 0,
    showId,
    seatIds = []
  } = location.state || {};

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [modal, setModal] = useState(null); // { type: "success" | "failed", message }

  useEffect(() => {
    loadShow();
  }, []);

  const loadShow = async () => {
    try {
      const data = await getShowById(showId);
      setShow(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---- Charges breakdown (display only, does not change payable logic) ----
  const bookingFeePercent = 0.07; // 7% convenience-style charge for display
  const bookingFee = Math.round(totalAmount * bookingFeePercent * 100) / 100;
  const payable = Math.round((totalAmount + bookingFee) * 100) / 100;

  const seatNumbers = selectedSeats.map((s) => s.seat.seatNumber).join(", ");
  const seatType = selectedSeats[0]?.seat?.seatType || "";

  const formatDateTime = (iso) => {
    if (!iso) return { date: "", time: "" };
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  };

  const { date: showDate, time: showTime } = formatDateTime(show?.startTime);
  const { time: endTime } = formatDateTime(show?.endTime);

  const handleBooking = async () => {
    try {
      setProcessing(true);

      // Step 1 — Create Booking (seats get LOCKED)
      const bookingRequest = {
        userId: 1,
        showId: Number(showId),
        seatIds: seatIds,
        paymentMethod: "RAZORPAY"
      };

      console.log("Creating booking...", bookingRequest);
      const booking = await createBooking(bookingRequest);
      console.log("Booking created:", booking);

      // Step 2 — Create Razorpay Order
      const orderData = {
        bookingId: booking.id,
        amount: payable,
        email: "mr.godfather9044271070@gmail.com",
        name: "Adarsh"
      };

      console.log("Creating Razorpay order...", orderData);
      const razorpayOrder = await createOrder(orderData);
      console.log("Razorpay order:", razorpayOrder);

      // Step 3 — Open Razorpay Checkout
      const options = {
        key: "rzp_test_T30fx1agTs1Vzw",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "BookMyShow",
        description: "Movie Ticket Booking",
        order_id: razorpayOrder.id,

        handler: async function (response) {
          console.log("Payment success:", response);
          try {
            await updateOrderStatus(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            setModal({ type: "success" });
          } catch (err) {
            console.error("Confirmation failed:", err);
            setModal({
              type: "failed",
              message: "Payment done but confirmation failed. Please contact support.",
            });
          }
        },

        prefill: {
          name: "Adarsh",
          email: "mr.godfather9044271070@gmail.com"
        },

        theme: { color: "#e94560" }
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", async function (response) {
        console.error("Payment failed:", response);
        try {
          await paymentFailed(razorpayOrder.id);
        } catch (err) {
          console.error("Failed to release seats:", err);
        }
        setModal({
          type: "failed",
          message: "Payment failed. Your seats have been released — please try again.",
        });
      });

      rzp.open();
    } catch (error) {
      console.error("Booking error:", error);
      if (error.response) {
        console.log("Status:", error.response.status);
        console.log("Data:", error.response.data);
      }
      setModal({
        type: "failed",
        message: error.response?.data?.message || error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-loading">
        <div className="payment-spinner"></div>
        <p>Loading booking details...</p>
      </div>
    );
  }

  const movie = show?.movie;
  const theater = show?.screen?.theater;

  return (
    <div className="payment-page">
      <div className="payment-banner">Review your booking</div>

      <div className="payment-layout">
        {/* LEFT: Booking card */}
        <div className="booking-card">
          <div className="booking-card-header">
            <div>
              <div className="movie-name">{movie?.title}</div>
              <div className="movie-subtags">
                {seatType && <span>{seatType}</span>}
                {movie?.language && <span>{movie.language}</span>}
                {movie?.genre && <span>{movie.genre}</span>}
              </div>
              <div className="theater-line">
                {theater?.name}
                {theater?.city ? `, ${theater.city}` : ""}
              </div>
            </div>
            {movie?.posterUrl && (
              <img className="movie-poster-thumb" src={movie.posterUrl} alt={movie?.title} />
            )}
          </div>

          <div className="info-pill">
            Cancellation is unavailable for this booking
          </div>

          <div className="booking-divider"></div>

          <div className="showtime-line">
            <div className="showtime-date">{showDate}</div>
            <div className="showtime-time">
              {showTime} {endTime && `- ${endTime} (approx)`}
            </div>
          </div>

          <div className="booking-divider"></div>

          <div className="ticket-line">
            <div>
              <div className="ticket-count">
                {selectedSeats.length} ticket{selectedSeats.length > 1 ? "s" : ""}
              </div>
              <div className="ticket-seats">
                {seatType} - {seatNumbers}
              </div>
              <div className="ticket-screen">
                {show?.screen?.name}
              </div>
            </div>
            <div className="ticket-amount">₹{totalAmount}</div>
          </div>
        </div>

        {/* RIGHT: Payment summary */}
        <div className="summary-card">
          <div className="summary-title">Payment summary</div>

          <div className="summary-row">
            <span>Order amount</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Booking charge (incl. of GST)</span>
            <span>₹{bookingFee.toFixed(2)}</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row summary-total">
            <span>To be paid</span>
            <span>₹{payable.toFixed(2)}</span>
          </div>

          <button
            className="pay-now-btn"
            onClick={handleBooking}
            disabled={processing}
          >
            <span className="pay-now-amount">
              ₹{payable.toFixed(2)}
              <small>TOTAL</small>
            </span>
            <span>{processing ? "Processing..." : "Pay now"}</span>
          </button>
        </div>
      </div>

      {modal && (
        <div className="result-modal-overlay" onClick={() => setModal(null)}>
          <div className="result-modal" onClick={(e) => e.stopPropagation()}>
            <button className="result-close-btn" onClick={() => setModal(null)}>
              ✕
            </button>

            {modal.type === "success" ? (
              <>
                <div className="result-icon result-icon-success">✓</div>
                <div className="result-title">Booking Confirmed</div>
                <div className="result-subtitle">
                  Your tickets for <strong>{movie?.title}</strong> are booked.
                </div>

                <div className="result-summary">
                  <div className="result-summary-row">
                    <span>Seats</span>
                    <span>{seatNumbers}</span>
                  </div>
                  <div className="result-summary-row">
                    <span>Showtime</span>
                    <span>{showDate}, {showTime}</span>
                  </div>
                  <div className="result-summary-row">
                    <span>Amount paid</span>
                    <span>₹{payable.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  className="result-primary-btn"
                  onClick={() => navigate("/my-bookings")}
                >
                  Go to My Bookings
                </button>
                <button
                  className="result-secondary-btn"
                  onClick={() => setModal(null)}
                >
                  Stay on this page
                </button>
              </>
            ) : (
              <>
                <div className="result-icon result-icon-failed">✕</div>
                <div className="result-title">Booking Failed</div>
                <div className="result-subtitle">{modal.message}</div>

                <button
                  className="result-primary-btn result-retry-btn"
                  onClick={() => setModal(null)}
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentPage;