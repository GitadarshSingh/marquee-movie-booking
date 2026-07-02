package com.cfs.BOOKMYSHOW.repository;

import com.cfs.BOOKMYSHOW.model.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {

       List<Seat> findBySeatNumber(String seatNumber);

       List<Seat> findBySeatType(String seatType);

       // --- ADD THIS ---
       List<Seat> findByScreenId(Long screenId);
}