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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ShowAutoRefresher implements CommandLineRunner {

    @Autowired private ShowRepository showRepository;
    @Autowired private MovieRepository movieRepository;
    @Autowired private ScreenRepository screenRepository;
    @Autowired private ShowSeatRepository showSeatRepository;
    @Autowired private SeatRepository seatRepository;

    private static final int DAYS_AHEAD = 7;

    // 8 slots x 15 screens = 120 slots/din, 116 movies ke liye kaafi hai
    // (har movie ko roz kam se kam 1 show milega)
    private static final LocalTime[] SLOT_TIMES = {
            LocalTime.of(8, 0),  LocalTime.of(10, 0), LocalTime.of(12, 0), LocalTime.of(14, 0),
            LocalTime.of(16, 0), LocalTime.of(18, 0), LocalTime.of(20, 0), LocalTime.of(22, 0)
    };

    @Override
    public void run(String... args) {
        LocalDate today = LocalDate.now();

        List<Movie> movies = new ArrayList<>(movieRepository.findAll());
        List<Screen> screens = new ArrayList<>(screenRepository.findAll());
        if (movies.isEmpty() || screens.isEmpty()) {
            log.info("ShowAutoRefresher: movies ya screens khali hain, shows nahi bane");
            return;
        }
        movies.sort(Comparator.comparing(Movie::getId));
        screens.sort(Comparator.comparing(Screen::getId));

        int slotsPerDay = screens.size() * SLOT_TIMES.length;
        Map<Long, List<Seat>> seatCache = new HashMap<>();
        int generatedCount = 0;

        for (int d = 0; d < DAYS_AHEAD; d++) {
            LocalDate date = today.plusDays(d);

            for (int si = 0; si < screens.size(); si++) {
                Screen screen = screens.get(si);

                for (int ti = 0; ti < SLOT_TIMES.length; ti++) {
                    LocalDateTime startTime = date.atTime(SLOT_TIMES[ti]);

                    // slot pehle se bhara hai to chhod do (restart par duplicate nahi banenge)
                    if (showRepository.existsByScreenIdAndStartTime(screen.getId(), startTime)) continue;

                    // har screen/slot par alag movie: movies ke beech ghumta hai
                    long slotNumber = (long) si * SLOT_TIMES.length + ti;
                    int movieIndex = (int) ((date.toEpochDay() * slotsPerDay + slotNumber) % movies.size());
                    Movie movie = movies.get(movieIndex);

                    List<Seat> seats = seatCache.computeIfAbsent(
                            screen.getId(), id -> seatRepository.findByScreenId(id));

                    createShow(movie, screen, startTime, seats);
                    generatedCount++;
                }
            }
        }
        log.info("ShowAutoRefresher: generated {} new shows for {} movies x {} screens",
                generatedCount, movies.size(), screens.size());
    }

    private void createShow(Movie movie, Screen screen, LocalDateTime startTime, List<Seat> seats) {
        Show show = new Show();
        show.setMovie(movie);
        show.setScreen(screen);
        show.setStartTime(startTime);
        show.setEndTime(startTime.plusMinutes(movie.getDurationMins() + 15));
        Show saved = showRepository.save(show);

        List<ShowSeat> showSeats = new ArrayList<>(seats.size());
        for (Seat seat : seats) {
            ShowSeat ss = new ShowSeat();
            ss.setShow(saved);
            ss.setSeat(seat);
            ss.setStatus(SeatStatus.AVAILABLE);
            ss.setPrice(seat.getBasePrice());
            showSeats.add(ss);
        }
        showSeatRepository.saveAll(showSeats);
    }
}