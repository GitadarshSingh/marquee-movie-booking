package com.cfs.BOOKMYSHOW.dto;

import com.cfs.BOOKMYSHOW.SeatStatus;
import com.cfs.BOOKMYSHOW.model.Seat;
import com.cfs.BOOKMYSHOW.model.Show;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShowSeatDto {

//    private Long id;
//    private ShowDto show;
//    private SeatDto seat;
//    private SeatStatus status;
//    private Double price;

    private Long id;

    private Long showId;

    private SeatDto seat;

    private SeatStatus status;

    private BigDecimal price;
}
