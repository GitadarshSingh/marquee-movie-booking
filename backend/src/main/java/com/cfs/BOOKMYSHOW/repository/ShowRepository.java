package com.cfs.BOOKMYSHOW.repository;

import com.cfs.BOOKMYSHOW.model.Show;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ShowRepository extends JpaRepository<Show, Long> {

    List<Show> findByMovieId(Long movieId);

    List<Show> findByMovie_IdAndScreen_Theater_City(Long movieId, String city);

    List<Show> findByStartTimeBetween(LocalDateTime startDate, LocalDateTime endDate);

    List<Show> findByScreenId(Long screenId);

    // --- ADD THESE TWO NEW METHODS ---
    boolean existsByMovieIdAndScreenIdAndStartTimeBetween(
            Long movieId, Long screenId, LocalDateTime start, LocalDateTime end);

    boolean existsByScreenIdAndStartTime(Long screenId, LocalDateTime startTime);
}