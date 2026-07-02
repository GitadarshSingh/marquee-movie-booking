package com.cfs.BOOKMYSHOW.service;

import com.cfs.BOOKMYSHOW.SeatStatus;
import com.cfs.BOOKMYSHOW.model.ShowSeat;
import com.cfs.BOOKMYSHOW.repository.ShowSeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class SeatUnlockScheduler {

    @Autowired
    private ShowSeatRepository showSeatRepository;

    // Runs every 10 seconds, checks for seats locked longer than 30 seconds
    @Scheduled(fixedRate = 10000)
    public void releaseExpiredLocks() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(30);

        List<ShowSeat> lockedSeats = showSeatRepository.findAll().stream()
                .filter(s -> s.getStatus() == SeatStatus.LOCKED)
                .filter(s -> s.getLockedAt() != null && s.getLockedAt().isBefore(cutoff))
                .toList();

        if (!lockedSeats.isEmpty()) {
            for (ShowSeat seat : lockedSeats) {
                seat.setStatus(SeatStatus.AVAILABLE);
                seat.setLockedAt(null);
                seat.setBooking(null);
            }
            showSeatRepository.saveAll(lockedSeats);
            System.out.println("Released " + lockedSeats.size() + " expired locked seat(s).");
        }
    }
}