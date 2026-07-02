package com.cfs.BOOKMYSHOW.service;

import com.cfs.BOOKMYSHOW.dto.UserDto;
import com.cfs.BOOKMYSHOW.exception.ResourceNotFoundException;
import com.cfs.BOOKMYSHOW.model.User;
import com.cfs.BOOKMYSHOW.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public UserDto createUser(UserDto userDto)
    {
        User user=maptoEntity(userDto);
        User savedUser=userRepository.save(user);
        return maptoDto(savedUser);
    }

    private User maptoEntity(UserDto userDto)
    {
        User user=new User();
        user.setId(userDto.getId());
        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());
        user.setPhoneNumber(userDto.getPhoneNumber());

        return user;
    }

    private UserDto maptoDto(User user)
    {
        UserDto userDto=new UserDto();
        userDto.setId(user.getId());
        userDto.setName(user.getName());
        userDto.setEmail(user.getEmail());
        userDto.setPhoneNumber(user.getPhoneNumber());
        return userDto;
    }

    public UserDto getUserById(Long id)
    {
       User user= userRepository.findById(id)
               .orElseThrow(()->new ResourceNotFoundException("User Id Not Found"+id));
       return maptoDto(user);

    }

    public UserDto getUserByName(String name)
    {
        User user= userRepository.findByName(name)
        .orElseThrow(()->new ResourceNotFoundException("User Id Not Found"+name));
        return maptoDto(user);
    }

    public UserDto getUserByEmail(String email)
    {
        User user= userRepository.findByEmail(email)
                .orElseThrow(()->new ResourceNotFoundException("User Id Not Found"+email));
        return maptoDto(user);
    }

    public List<UserDto> getAllUsers()
    {
        List<User> users=userRepository.findAll();
        return users.stream()
                .map(this::maptoDto)
                .collect(Collectors.toList());
    }

    public void deleteById(Long id)
    {
        userRepository.deleteById(id);

    }

    public UserDto updateUser(Long id, UserDto userDto)
    {
        User user=userRepository.findById(id)
                .orElseThrow(()->new ResourceNotFoundException("user not found"));

        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());

        User updateuser=userRepository.save(user);
        return maptoDto(updateuser);
    }



}
