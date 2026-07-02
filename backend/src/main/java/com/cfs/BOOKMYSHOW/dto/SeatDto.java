package com.cfs.BOOKMYSHOW.dto;

import com.cfs.BOOKMYSHOW.SeatType;
import com.cfs.BOOKMYSHOW.model.Screen;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeatDto {

//    private Long id;
//    private String seatNumber;
//    private  String seatType;
//    private Double basePrice;
//    private Screen screen;

    private Long id;

    private String seatNumber;

    private SeatType seatType;

    private BigDecimal basePrice;

     private Long screenId;

}
