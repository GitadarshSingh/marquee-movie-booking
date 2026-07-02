package com.cfs.BOOKMYSHOW.repository;

import com.cfs.BOOKMYSHOW.model.Theater;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TheaterRepository extends JpaRepository<Theater,Long> {

    List<Theater> findByName(String name);

    List<Theater> findByAddress(String address);
    List<Theater> findByCity(String city);


}
