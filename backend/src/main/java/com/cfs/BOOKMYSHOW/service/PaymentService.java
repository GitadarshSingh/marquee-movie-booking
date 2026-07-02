package com.cfs.BOOKMYSHOW.service;

import com.cfs.BOOKMYSHOW.BookingStatus;
import com.cfs.BOOKMYSHOW.PaymentStatus;
import com.cfs.BOOKMYSHOW.SeatStatus;
import com.cfs.BOOKMYSHOW.dto.PaymentRequestDto;
import com.cfs.BOOKMYSHOW.exception.ResourceNotFoundException;
import com.cfs.BOOKMYSHOW.model.Booking;
import com.cfs.BOOKMYSHOW.model.Payment;
import com.cfs.BOOKMYSHOW.model.ShowSeat;
import com.cfs.BOOKMYSHOW.repository.BookingRepository;
import com.cfs.BOOKMYSHOW.repository.PaymentRepository;
import com.cfs.BOOKMYSHOW.repository.ShowSeatRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class PaymentService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ShowSeatRepository showSeatRepository;

    @Transactional
    public String createOrder(PaymentRequestDto request) throws RazorpayException {

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        RazorpayClient client = new RazorpayClient(keyId, keySecret);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", request.getAmount()
                .multiply(java.math.BigDecimal.valueOf(100))
                .longValue());
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "txn_" + UUID.randomUUID());

        Order razorpayOrder = client.orders.create(orderRequest);
        String razorpayOrderId = razorpayOrder.get("id").toString();

        Payment payment = booking.getPayment();
        payment.setOrderId(razorpayOrderId);
        payment.setStatus(PaymentStatus.CREATED);
        payment.setCreatedAt(LocalDateTime.now());
        payment.setTransactionId(UUID.randomUUID().toString());
        payment.setName(request.getName());
        payment.setEmail(request.getEmail());
        payment.setAmount(request.getAmount());

        paymentRepository.save(payment);

        log.info("Razorpay Order Created: {}", razorpayOrderId);
        return razorpayOrder.toString();
    }

    // ✅ Verify Razorpay signature
    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);
            Utils.verifyPaymentSignature(attributes, keySecret);
            return true;
        } catch (RazorpayException e) {
            log.error("Signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    @Transactional
    public void updateOrderStatus(String orderId, String paymentId, String status) {

        Payment order = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        order.setPaymentId(paymentId);
        order.setStatus(PaymentStatus.valueOf(status.toUpperCase()));
        order.setPaymentTime(LocalDateTime.now());

        if (order.getStatus() == PaymentStatus.SUCCESS) {
            Booking booking = order.getBooking();
            if (booking != null) {
                booking.setStatus(BookingStatus.CONFIRMED);
                bookingRepository.save(booking);

                List<ShowSeat> seats = showSeatRepository.findByBookingId(booking.getId());
                seats.forEach(seat -> {
                    seat.setStatus(SeatStatus.BOOKED);
                    seat.setLockedAt(null);
                });
                showSeatRepository.saveAll(seats);

                emailService.sendEmail(
                        order.getEmail(),
                        order.getName(),
                        String.valueOf(order.getAmount()),
                        booking.getShow().getMovie().getTitle()
                );
            }
        } else if (order.getStatus() == PaymentStatus.FAILED) {
            Booking booking = order.getBooking();
            if (booking != null) {
                booking.setStatus(BookingStatus.CANCELLED);
                bookingRepository.save(booking);

                List<ShowSeat> seats = showSeatRepository.findByBookingId(booking.getId());
                seats.forEach(seat -> {
                    seat.setStatus(SeatStatus.AVAILABLE);
                    seat.setLockedAt(null);
                    seat.setBooking(null);
                });
                showSeatRepository.saveAll(seats);
            }
        }

        paymentRepository.save(order);
    }
}