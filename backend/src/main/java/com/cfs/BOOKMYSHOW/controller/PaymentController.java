package com.cfs.BOOKMYSHOW.controller;

import com.cfs.BOOKMYSHOW.dto.PaymentRequestDto;
import com.cfs.BOOKMYSHOW.service.PaymentService;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("api/payments")
@CrossOrigin("*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    // Step 1 - Create Razorpay Order
    @PostMapping("/create-orders")
    public ResponseEntity<String> createPayment(@RequestBody PaymentRequestDto request) {
        try {
            String response = paymentService.createOrder(request);
            return ResponseEntity.ok(response);
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }

    // Step 2 - Payment Success (verify signature → confirm booking)
    @PostMapping("/update-orders")
    public ResponseEntity<String> updatePayment(
            @RequestParam String orderId,
            @RequestParam String paymentId,
            @RequestParam String signature) {

        boolean isValid = paymentService.verifySignature(orderId, paymentId, signature);

        if (!isValid) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Payment verification failed");
        }

        paymentService.updateOrderStatus(orderId, paymentId, "SUCCESS");
        log.info("Payment verified for OrderId: {}", orderId);
        return ResponseEntity.ok("Booking confirmed successfully");
    }

    // Step 3 - Payment Failed (release seats)
    @PostMapping("/payment-failed")
    public ResponseEntity<String> paymentFailed(@RequestParam String orderId) {
        paymentService.updateOrderStatus(orderId, "FAILED_" + orderId, "FAILED");
        log.info("Payment failed for OrderId: {}", orderId);
        return ResponseEntity.ok("Seats released");
    }
}