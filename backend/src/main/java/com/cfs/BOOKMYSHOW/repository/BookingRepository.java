package com.cfs.BOOKMYSHOW.repository;

import com.cfs.BOOKMYSHOW.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking,Long> {

    List<Booking> findByUserId(Long userId);

    Optional<Booking> findByBookingNumber(String bookingNumber);

    Optional<Booking> findByShowId(Long id);
}

