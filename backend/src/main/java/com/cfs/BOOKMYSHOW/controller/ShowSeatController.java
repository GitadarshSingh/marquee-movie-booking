package com.cfs.BOOKMYSHOW.controller;

import com.cfs.BOOKMYSHOW.dto.ShowSeatDto;
import com.cfs.BOOKMYSHOW.service.ShowSeatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/show-seats")
@CrossOrigin("*")
public class ShowSeatController {

    @Autowired
    private ShowSeatService showSeatService;

    @GetMapping("/show/{showId}")
    public ResponseEntity<List<ShowSeatDto>> getSeatsByShowId(
            @PathVariable Long showId) {

        return ResponseEntity.ok(
                showSeatService.getSeatsByShowId(showId)
        );
    }
}