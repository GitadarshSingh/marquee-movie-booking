package com.cfs.BOOKMYSHOW.security;

import com.cfs.BOOKMYSHOW.SeatStatus;
import com.cfs.BOOKMYSHOW.model.*;
import com.cfs.BOOKMYSHOW.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Component
public class ShowAutoRefresher implements CommandLineRunner {

    @Autowired private ShowRepository showRepository;
    @Autowired private MovieRepository movieRepository;
    @Autowired private ScreenRepository screenRepository;
    @Autowired private ShowSeatRepository showSeatRepository;
    @Autowired private SeatRepository seatRepository;

    private static final int DAYS_AHEAD = 7;
    private static final LocalTime[] SLOT_TIMES = {
            LocalTime.of(9, 0), LocalTime.of(12, 0), LocalTime.of(15, 0),
            LocalTime.of(18, 0), LocalTime.of(21, 0)
    };

    @Override
    public void run(String... args) {
        LocalDate today = LocalDate.now();
        LocalDate lastNeededDate = today.plusDays(DAYS_AHEAD - 1);

        List<Movie> movies = movieRepository.findAll();
        List<Screen> screens = screenRepository.findAll();

        int generatedCount = 0;

        for (Movie movie : movies) {
            for (Screen screen : screens) {
                boolean hasFutureShows = showRepository
                        .existsByMovieIdAndScreenIdAndStartTimeBetween(
                                movie.getId(), screen.getId(),
                                lastNeededDate.atStartOfDay(),
                                lastNeededDate.atTime(23, 59)
                        );

                if (!hasFutureShows) {
                    generatedCount += generateShowsForWindow(movie, screen, today, lastNeededDate);
                }
            }
        }
        log.info("ShowAutoRefresher: generated {} new shows for {} movies x {} screens",
                generatedCount, movies.size(), screens.size());
    }

    private int generateShowsForWindow(Movie movie, Screen screen, LocalDate start, LocalDate end) {
        List<Seat> seats = seatRepository.findByScreenId(screen.getId());
        int count = 0;

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            for (LocalTime time : SLOT_TIMES) {
                LocalDateTime startTime = date.atTime(time);

                boolean exists = showRepository.existsByScreenIdAndStartTime(screen.getId(), startTime);
                if (exists) continue;

                LocalDateTime endTime = startTime.plusMinutes(movie.getDurationMins() + 15);

                Show show = new Show();
                show.setMovie(movie);
                show.setScreen(screen);
                show.setStartTime(startTime);
                show.setEndTime(endTime);
                Show saved = showRepository.save(show);

                for (Seat seat : seats) {
                    ShowSeat showSeat = new ShowSeat();
                    showSeat.setShow(saved);
                    showSeat.setSeat(seat);
                    showSeat.setStatus(SeatStatus.AVAILABLE);
                    showSeat.setPrice(seat.getBasePrice());
                    showSeatRepository.save(showSeat);
                }
                count++;
            }
        }
        return count;
    }
}