package com.cfs.BOOKMYSHOW.repository;

import com.cfs.BOOKMYSHOW.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {


    Optional<User> findByName(String name);
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);


}
