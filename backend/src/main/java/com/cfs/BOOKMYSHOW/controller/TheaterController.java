package com.cfs.BOOKMYSHOW.controller;

import com.cfs.BOOKMYSHOW.dto.TheaterDto;
import com.cfs.BOOKMYSHOW.service.TheaterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/theaters")
@CrossOrigin("*")
public class TheaterController {

    @Autowired
    private TheaterService theaterService;

    @GetMapping
    public ResponseEntity<List<TheaterDto>> getAllTheaters() {
        return ResponseEntity.ok(theaterService.getAllTheaters());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TheaterDto> getTheaterById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                theaterService.getTheaterById(id)
        );
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<List<TheaterDto>> getTheatersByCity(
            @PathVariable String city) {

        return ResponseEntity.ok(
                theaterService.getTheaterByCity(city)
        );
    }
}