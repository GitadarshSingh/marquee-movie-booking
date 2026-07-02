package com.cfs.BOOKMYSHOW.dto;


import com.cfs.BOOKMYSHOW.model.Seat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScreenDto {

    private Long id;
    private String name;
    private Integer totalSeats;
    private TheaterDto theater;

    private List<SeatDto> seats;

}
