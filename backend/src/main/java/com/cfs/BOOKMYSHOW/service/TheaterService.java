package com.cfs.BOOKMYSHOW.service;


import com.cfs.BOOKMYSHOW.dto.TheaterDto;
import com.cfs.BOOKMYSHOW.exception.ResourceNotFoundException;
import com.cfs.BOOKMYSHOW.model.Theater;
import com.cfs.BOOKMYSHOW.repository.TheaterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TheaterService {

    @Autowired
    private TheaterRepository theaterRepository;

    public TheaterDto createTheater(TheaterDto theaterDto)
    {
        Theater theater=mapToEntity(theaterDto);
        Theater savedTheater=theaterRepository.save(theater);
        return mapToDto(savedTheater);
        

    }

    private TheaterDto mapToDto(Theater theater) {
        TheaterDto theaterDto=new TheaterDto();
        theaterDto.setId(theater.getId());
        theaterDto.setName(theater.getName());
        theaterDto.setCity(theater.getCity());
        theaterDto.setAddress(theater.getAddress());
        theaterDto.setTotalScreens(theater.getTotalScreens());

        return theaterDto;
    }

    private Theater mapToEntity(TheaterDto theaterDto) {
        Theater theater=new Theater();
        theater.setName(theaterDto.getName());
        theater.setAddress(theaterDto.getAddress());
        theater.setCity(theaterDto.getCity());
        theater.setTotalScreens(theaterDto.getTotalScreens());
        return theater;
        /*TheaterDto ka data -> Theater entity mein copy kar rahe hain*/
    }

    public TheaterDto getTheaterById(Long id)
    {
        Theater theater= theaterRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Theater id not found "+id));
        return mapToDto(theater);
    }

    public List<TheaterDto> getAllTheaters()
    {
        List<Theater> theaters=theaterRepository.findAll();
        return theaters.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

    }

    public List<TheaterDto> getTheaterByAddress(String address)
    {
        List<Theater> theaters=theaterRepository.findByAddress(address);
        return theaters.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    public List<TheaterDto> getTheaterByCity(String city)
    {
        List<Theater> theaters=theaterRepository.findByCity(city);
        return theaters.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    //update theater
    //delete theater
}
/*

Client
   ↓
Controller
   ↓ (DTO)
Service Layer
   ↓ (Entity)
Repository
   ↓
Database

 */