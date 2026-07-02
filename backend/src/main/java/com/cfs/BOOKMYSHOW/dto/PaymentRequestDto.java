package com.cfs.BOOKMYSHOW.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaymentRequestDto {
    private Long bookingId;     // links payment to booking
    private BigDecimal amount;
    private String name;        // for email
    private String email;       // for email
}