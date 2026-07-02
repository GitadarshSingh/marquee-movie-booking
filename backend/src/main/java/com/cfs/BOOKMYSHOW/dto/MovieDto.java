package com.cfs.BOOKMYSHOW.dto;


import com.cfs.BOOKMYSHOW.model.Show;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovieDto {

//    private Long id;
//    private String title;
//    private String discription;
//    private String language;
//    private String genre;
//    private Integer durationMins;
//    private String releaseDate;
//    private String posterUrl;

    private Long id;

    private String title;

    private String genre;

    private String language;

    private Integer durationMins;

    private Double rating;

    private String description;

    private String posterUrl;

    private String trailerUrl;

    private String releaseDate;

    private String certificate;


}
