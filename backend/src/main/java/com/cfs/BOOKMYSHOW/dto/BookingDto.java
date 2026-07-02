package com.cfs.BOOKMYSHOW.dto;



import com.cfs.BOOKMYSHOW.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingDto {

    private Long id;
    private String bookingNumber;
    private LocalDateTime bookingTime;
    private BookingStatus status;
    private BigDecimal totalAmount;
    private ShowDto show;

    private List<ShowSeatDto> seats;
    private PaymentDto payment;
    private UserDto user;
}
