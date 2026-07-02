package com.cfs.BOOKMYSHOW.service;

import com.cfs.BOOKMYSHOW.dto.ScreenDto;
import com.cfs.BOOKMYSHOW.dto.SeatDto;
import com.cfs.BOOKMYSHOW.dto.TheaterDto;
import com.cfs.BOOKMYSHOW.exception.ResourceNotFoundException;
import com.cfs.BOOKMYSHOW.model.Screen;
import com.cfs.BOOKMYSHOW.model.Seat;
import com.cfs.BOOKMYSHOW.repository.ScreenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScreenService {

    @Autowired
    private ScreenRepository screenRepository;

    public List<ScreenDto> getScreensByTheater(Long theaterId)
    {
        List<Screen> screens = screenRepository.findByTheaterId(theaterId);

        if (screens.isEmpty())
        {
            throw new ResourceNotFoundException(
                    "No screens found for theater id : " + theaterId
            );
        }

        return screens.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private ScreenDto mapToDto(Screen screen)
    {
        ScreenDto dto = new ScreenDto();

        dto.setId(screen.getId());
        dto.setName(screen.getName());
        dto.setTotalSeats(screen.getTotalSeats());

        TheaterDto theaterDto = new TheaterDto();
        theaterDto.setId(screen.getTheater().getId());
        theaterDto.setName(screen.getTheater().getName());
        theaterDto.setAddress(screen.getTheater().getAddress());
        theaterDto.setCity(screen.getTheater().getCity());
        theaterDto.setTotalScreens(screen.getTheater().getTotalScreens());

        dto.setTheater(theaterDto);

        List<SeatDto> seatDtos = screen.getSeats()
                .stream()
                .map(this::mapSeatToDto)
                .collect(Collectors.toList());

        dto.setSeats(seatDtos);

        return dto;
    }

    private SeatDto mapSeatToDto(Seat seat)
    {
        SeatDto dto = new SeatDto();

        dto.setId(seat.getId());
        dto.setSeatNumber(seat.getSeatNumber());
        dto.setSeatType(seat.getSeatType());
        dto.setBasePrice(seat.getBasePrice());

        return dto;
    }
}