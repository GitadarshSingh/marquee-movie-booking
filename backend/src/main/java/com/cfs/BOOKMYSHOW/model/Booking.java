package com.cfs.BOOKMYSHOW.model;

import com.cfs.BOOKMYSHOW.BookingStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name="bookings")
@Getter
@Setter // --> ye getter setter bana dega apko nhi banana
@NoArgsConstructor // --> ye no args constructor bana deta hai
@AllArgsConstructor //-->  ye all args constructor bana deta hai
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false,unique=true)
    private String bookingNumber;


    @Column(nullable=false)
    private LocalDateTime bookingTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;  // Confirm ,pending, cancell status

    @ManyToOne
    @JoinColumn(name="user_id",nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name="show_id",nullable = false)
    private Show show;

    @Column(nullable = false)
    private BigDecimal totalAmount;  // GST lagne ke baad kabhi kabhi decimal mein aa jati hai


    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<ShowSeat> showSeats;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name="payment_id")
    private Payment payment;
}
