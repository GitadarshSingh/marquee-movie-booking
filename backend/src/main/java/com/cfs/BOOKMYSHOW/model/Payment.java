package com.cfs.BOOKMYSHOW.model;

import com.cfs.BOOKMYSHOW.PaymentStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String transactionId;;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_time", nullable = true)
    private LocalDateTime paymentTime;

    @Column(nullable = true)
    private String paymentMethod;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status; // Success , Failed, Pending

    @OneToOne(mappedBy = "payment")
    @JsonIgnore /* @JsonIgnore JSON response में field को छुपाता है और bidirectional relationships की वजह से होने वाली infinite recursion (StackOverflowError) को रोकता है।*/
    private Booking booking;

    private LocalDateTime createdAt;

    @Column(unique = true)
    private String orderId;

    @Column(unique = true)
    private String paymentId;

    @Column
    private String email;
    @Column
    private String name;




}
