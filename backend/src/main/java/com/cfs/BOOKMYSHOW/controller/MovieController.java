package com.cfs.BOOKMYSHOW.controller;

import com.cfs.BOOKMYSHOW.dto.BookingDto;
import com.cfs.BOOKMYSHOW.dto.BookingRequestDto;
import com.cfs.BOOKMYSHOW.dto.MovieDto;
import com.cfs.BOOKMYSHOW.service.MovieService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/movies")
@CrossOrigin("*")
public class MovieController {

    @Autowired
    private MovieService movieService;

    @PostMapping
    public ResponseEntity<MovieDto> createMovie(@Valid @RequestBody MovieDto movieDto)
    {
        return new ResponseEntity<>(movieService.createMovie(movieDto), HttpStatus.CREATED);

    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieDto> getMovieById(@PathVariable Long id)
    {
        return ResponseEntity.ok(movieService.getMovieById(id));
    }

    @GetMapping
    public ResponseEntity <List<MovieDto>> getAllMovie()
    {
        return ResponseEntity.ok(movieService.getAllMovies());
    }
}
