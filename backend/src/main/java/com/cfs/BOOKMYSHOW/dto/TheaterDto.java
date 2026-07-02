package com.cfs.BOOKMYSHOW.dto;

import com.cfs.BOOKMYSHOW.model.Screen;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TheaterDto {
    private Long id;
    private String name;
    private String address;
    private String city;
    private Integer totalScreens;

}
