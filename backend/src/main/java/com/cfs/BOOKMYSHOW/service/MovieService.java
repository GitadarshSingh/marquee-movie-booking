package com.cfs.BOOKMYSHOW.service;

import com.cfs.BOOKMYSHOW.dto.MovieDto;
import com.cfs.BOOKMYSHOW.exception.ResourceNotFoundException;
import com.cfs.BOOKMYSHOW.model.Movie;
import com.cfs.BOOKMYSHOW.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MovieService {

    @Autowired
    private MovieRepository movieRepository;

    //3
    public MovieDto createMovie(MovieDto movieDto)
    {
        Movie movie=mapToEntity(movieDto);
        Movie saveMovie=movieRepository.save(movie);
        return mapToDto(saveMovie);
    }
    public MovieDto getMovieById(Long id)
    {
        Movie movie=movieRepository.findById(id)
                .orElseThrow(()->new ResourceNotFoundException("Movie Not Found With Id: "+id));
        return mapToDto(movie);
    }

    public List<MovieDto> getAllMovies()
    {
        List<Movie> movies=movieRepository.findAll();
        return movies.stream() // stream(), list ko process karne ke mode me convert karta hai
                .map(this::mapToDto) // map() :Ek object ko doosre object me convert karna → Movie → MovieDto
                //Yahan 'this' current class object ko represent karta hai : current object ka mapToDto() method use karo
                .collect(Collectors.toList()); // this::mapToDto → mapToDto() method ko directly use karna

    }
    public List<MovieDto> getMovieByLanguage(String language)
    {
        List<Movie> movies=movieRepository.findByLanguage(language);
        return movies.stream() // stream(), list ko process karne ke mode me convert karta hai
                .map(this::mapToDto)
                .collect(Collectors.toList()); // this::mapToDto → mapToDto() method ko directly use karna

    }

    public List<MovieDto> getMovieByGenere(String genre)
    {
        List<Movie> movies=movieRepository.findByLanguage(genre);
        return movies.stream() // stream(), list ko process karne ke mode me convert karta hai
                .map(this::mapToDto)
                .collect(Collectors.toList()); // this::mapToDto → mapToDto() method ko directly use karna

    }

    public List<MovieDto> searchMovie(String title)
    {
        List<Movie> movies=movieRepository.findByLanguage(title);
        return movies.stream() // stream(), list ko process karne ke mode me convert karta hai
                .map(this::mapToDto)
                .collect(Collectors.toList()); // this::mapToDto → mapToDto() method ko directly use karna

    }

    public MovieDto updateMovie(Long id, MovieDto movieDto)
    {
        Movie movie=movieRepository.findById(id)
                .orElseThrow(()->new ResourceNotFoundException("Movie not found with id: "+id));

        movie.setId(movieDto.getId());
        movie.setTitle(movieDto.getTitle());
        movie.setLanguage(movieDto.getLanguage());
        movie.setGenre(movieDto.getGenre());
        movie.setDescription(movieDto.getDescription());
        movie.setDurationMins(movieDto.getDurationMins());
        movie.setReleaseDate(movieDto.getReleaseDate());
        movie.setPosterUrl(movieDto.getPosterUrl());

        Movie updatedMovie=movieRepository.save(movie);
        return mapToDto(updatedMovie);

    }

    public void deleteMovie(Long id)
    {
        Movie movie=movieRepository.findById(id)
                .orElseThrow(()->new ResourceNotFoundException("Movie Not found by Id"+id));

        movieRepository.delete(movie);
    }

    //2
    private MovieDto mapToDto(Movie movie)
    {
        MovieDto movieDto=new MovieDto();
        movieDto.setId(movie.getId());
        movieDto.setTitle(movie.getTitle());
        movieDto.setLanguage(movie.getLanguage());
        movieDto.setGenre(movie.getGenre());
        movieDto.setDescription(movie.getDescription());
        movieDto.setDurationMins(movie.getDurationMins());
        movieDto.setPosterUrl(movie.getPosterUrl());

        return movieDto;
    }

    //1
    public Movie mapToEntity(MovieDto movieDto)
    {
        Movie movie=new Movie();
        movie.setId(movieDto.getId());
        movie.setTitle(movieDto.getTitle());
        movie.setLanguage(movieDto.getLanguage());
        movie.setGenre(movieDto.getGenre());
        movie.setDescription(movieDto.getDescription());
        movie.setDurationMins(movieDto.getDurationMins());
        movie.setReleaseDate(movieDto.getReleaseDate());
        movie.setPosterUrl(movieDto.getPosterUrl());

        return movie;
    }


}
