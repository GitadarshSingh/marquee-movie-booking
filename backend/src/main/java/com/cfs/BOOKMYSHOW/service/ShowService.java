package com.cfs.BOOKMYSHOW.service;

import com.cfs.BOOKMYSHOW.SeatStatus;
import com.cfs.BOOKMYSHOW.dto.*;
import com.cfs.BOOKMYSHOW.exception.ResourceNotFoundException;
import com.cfs.BOOKMYSHOW.model.Movie;
import com.cfs.BOOKMYSHOW.model.Screen;
import com.cfs.BOOKMYSHOW.model.Show;
import com.cfs.BOOKMYSHOW.model.ShowSeat;
import com.cfs.BOOKMYSHOW.repository.MovieRepository;
import com.cfs.BOOKMYSHOW.repository.ScreenRepository;
import com.cfs.BOOKMYSHOW.repository.ShowRepository;
import com.cfs.BOOKMYSHOW.repository.ShowSeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class ShowService {

    @Autowired
    private MovieRepository movieRepository;
    @Autowired
    private ScreenRepository screenRepository;
    @Autowired
    private ShowRepository showRepository;
    @Autowired
    private ShowSeatRepository showSeatRepository;

    public ShowDto createShow(ShowDto showDto)
    {
        Show show=new Show();
        Movie movie=movieRepository.findById(showDto.getMovie().getId())
                .orElseThrow(()->new ResourceNotFoundException("Movie Not Found"));

        Screen screen = screenRepository.findById(showDto.getScreen().getId())
                .orElseThrow(()->new ResourceNotFoundException("Screen Not Found"));

        show.setMovie(movie);
        show.setScreen(screen);
        show.setStartTime(showDto.getStartTime());
        show.setEndTime(showDto.getEndTime());

        Show savedShow=showRepository.save(show);

        List<ShowSeat> availableSeats=
                showSeatRepository.findByShowIdAndStatus(savedShow.getId(), SeatStatus.AVAILABLE);

        return mapToDto(savedShow,availableSeats);
    }

    public ShowDto getShowById(Long id)
    {
        Show show=showRepository.findById(id)
                .orElseThrow(()->new ResourceNotFoundException("Show Not Found with Id "+id));

        List<ShowSeat> availableSeats=
                showSeatRepository.findByShowIdAndStatus(show.getId(),SeatStatus.AVAILABLE);
        return mapToDto(show,availableSeats);
    }

    public List<ShowDto> getAllShows()
    {
        List<Show> shows=showRepository.findAll();
                return shows.stream()
                        .map(show->{
                            List<ShowSeat> availableSeats=showSeatRepository.findByShowIdAndStatus(show.getId(),SeatStatus.AVAILABLE);
                            return mapToDto(show,availableSeats);
                        })
                        .collect(Collectors.toList());
    }

    public List<ShowDto> getShowsByMovieId(Long movieId)
    {
        List<Show> shows=showRepository.findByMovieId(movieId);
        return shows.stream()
                .map(show->{
                    List<ShowSeat> availableSeats=showSeatRepository.findByShowIdAndStatus(show.getId(),SeatStatus.AVAILABLE);
                    return mapToDto(show,availableSeats);
                })
                .collect(Collectors.toList());
    }

    public List<ShowDto> getShowByMovieCity(Long movieId,String city)
    {
        List<Show> shows=showRepository.findByMovie_IdAndScreen_Theater_City(movieId,city);
        return shows.stream()
                .map(show->{
                    List<ShowSeat> availableSeats=showSeatRepository.findByShowIdAndStatus(show.getId(),SeatStatus.AVAILABLE);
                    return mapToDto(show,availableSeats);
                })
                .collect(Collectors.toList());
    }

    public List<ShowDto> getShowByDateRange(LocalDateTime startDate, LocalDateTime endDate)
    {
        List<Show> shows=showRepository.findByStartTimeBetween(startDate,endDate);
        return shows.stream()
                .map(show->{
                    List<ShowSeat> availableSeats=showSeatRepository.findByShowIdAndStatus(show.getId(),SeatStatus.AVAILABLE);
                    return mapToDto(show,availableSeats);
                })
                .collect(Collectors.toList());
    }
    public List<ShowDto> getShowByScreenId(Long screenId)
    {
        List<Show> shows=showRepository.findByScreenId(screenId);
        return shows.stream()
                .map(show->{
                    List<ShowSeat> availableSeats=showSeatRepository.findByShowIdAndStatus(show.getId(),SeatStatus.AVAILABLE);
                    return mapToDto(show,availableSeats);
                })
                .collect(Collectors.toList());
    }



    private ShowDto mapToDto(Show show,List<ShowSeat> availableSeats)
    {
        ShowDto showDto=new ShowDto();
        showDto.setId(show.getId());
        showDto.setStartTime(show.getStartTime());
        showDto.setEndTime(show.getEndTime());

        MovieDto movieDto = new MovieDto();

        movieDto.setId(show.getMovie().getId());
        movieDto.setTitle(show.getMovie().getTitle());
        movieDto.setDescription(show.getMovie().getDescription());
        movieDto.setLanguage(show.getMovie().getLanguage());
        movieDto.setGenre(show.getMovie().getGenre());
        movieDto.setDurationMins(show.getMovie().getDurationMins());
        movieDto.setReleaseDate(show.getMovie().getReleaseDate());
        movieDto.setPosterUrl(show.getMovie().getPosterUrl());

        showDto.setMovie(movieDto);

        TheaterDto theaterDto=new TheaterDto(
                show.getScreen().getTheater().getId(),
                show.getScreen().getTheater().getName(),
                show.getScreen().getTheater().getAddress(),
                show.getScreen().getTheater().getCity(),
                show.getScreen().getTheater().getTotalScreens()
        );

        showDto.setScreen(new ScreenDto(
                show.getScreen().getId(),
                show.getScreen().getName(),
                show.getScreen().getTotalSeats(),
                theaterDto,
                null
        ));

        List<ShowSeatDto> seatDtos=availableSeats.stream()
                .map(seat->{
                    ShowSeatDto seatDto=new ShowSeatDto();
                    seatDto.setId(seat.getId());
                    seatDto.setStatus(seat.getStatus());
                    seatDto.setPrice(seat.getPrice());

                    SeatDto baseSeatDto=new SeatDto();
                    baseSeatDto.setId(seat.getSeat().getId());
                    baseSeatDto.setSeatNumber(seat.getSeat().getSeatNumber());
                    baseSeatDto.setSeatType(seat.getSeat().getSeatType());
                    baseSeatDto.setBasePrice(seat.getSeat().getBasePrice());

                    seatDto.setShowId(seat.getShow().getId());
                    seatDto.setSeat(baseSeatDto);
                    return seatDto;

                })
                .collect(Collectors.toList());

        showDto.setAvailableSeats(seatDtos);

        return showDto;

    }

}
