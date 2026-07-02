package com.cfs.BOOKMYSHOW.repository;

import com.cfs.BOOKMYSHOW.model.Movie;
import org.apache.catalina.LifecycleState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovieRepository extends JpaRepository<Movie,Long> {

    List<Movie> findByLanguage(String language);

    List<Movie> findByTitleContaining(String title);

    List<Movie> findByGenre(String genre);
}

/* 1. JpaRepository<Movie, Long> already contains by default: Optional<Movie> findById(Long id), So you do NOT need to write it manually inside MovieRepository.
  That’s why this works directly:movieRepository.findById(...)

  2. Optional<Movie> का मतलब: Movie मिल भी सकता है, नहीं भी मिल सकता। Maybe Movie exists, maybe empty that's why we can use  .orElseThrow()
  use करके बोलते हो: अगर movie नहीं मिली तो exception फेंको


Difference : Optional<T> vs List<T>

Optional<T> = one object मिल सकता है या empty हो सकता है 0 OR 1 object, Example: findById() -> Optional<Movie> :because ID unique होती है

List<T> = multiple objects store करता है or 2 या more objects के लिए: List<Movie> use होता है।

  */
