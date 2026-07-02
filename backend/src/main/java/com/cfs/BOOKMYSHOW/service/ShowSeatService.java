package com.cfs.BOOKMYSHOW.service;

import com.cfs.BOOKMYSHOW.dto.SeatDto;
import com.cfs.BOOKMYSHOW.dto.ShowSeatDto;
import com.cfs.BOOKMYSHOW.exception.ResourceNotFoundException;
import com.cfs.BOOKMYSHOW.model.ShowSeat;
import com.cfs.BOOKMYSHOW.repository.ShowSeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShowSeatService {

    @Autowired
    private ShowSeatRepository showSeatRepository;

    public List<ShowSeatDto> getSeatsByShowId(Long showId)
    {
        List<ShowSeat> showSeats = showSeatRepository.findByShowId(showId);

        if (showSeats.isEmpty())
        {
            throw new ResourceNotFoundException(
                    "No seats found for show id : " + showId
            );
        }

        return showSeats.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private ShowSeatDto mapToDto(ShowSeat showSeat)
    {
        ShowSeatDto dto = new ShowSeatDto();

        dto.setId(showSeat.getId());
        dto.setShowId(showSeat.getShow().getId());
        dto.setStatus(showSeat.getStatus());
        dto.setPrice(showSeat.getPrice());

        SeatDto seatDto = new SeatDto();
        seatDto.setId(showSeat.getSeat().getId());
        seatDto.setSeatNumber(showSeat.getSeat().getSeatNumber());
        seatDto.setSeatType(showSeat.getSeat().getSeatType());
        seatDto.setBasePrice(showSeat.getSeat().getBasePrice());

        dto.setSeat(seatDto);

        return dto;
    }
}