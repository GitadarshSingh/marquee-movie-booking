package com.cfs.BOOKMYSHOW.controller;

import com.cfs.BOOKMYSHOW.dto.ShowDto;
import com.cfs.BOOKMYSHOW.service.ShowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shows")
@CrossOrigin("*")
public class ShowController {

    @Autowired
    private ShowService showService;

    @GetMapping
    public ResponseEntity<List<ShowDto>> getAllShows() {
        return ResponseEntity.ok(
                showService.getAllShows()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShowDto> getShowById(@PathVariable Long id) {
        return ResponseEntity.ok(showService.getShowById(id));
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<ShowDto>> getShowsByMovieId(
            @PathVariable Long movieId) {

        return ResponseEntity.ok(
                showService.getShowsByMovieId(movieId)
        );
    }
    @GetMapping("/screen/{screenId}")
    public ResponseEntity<List<ShowDto>> getShowsByScreenId(
            @PathVariable Long screenId) {

        return ResponseEntity.ok(
                showService.getShowByScreenId(screenId)
        );
    }
}