package com.cfs.BOOKMYSHOW.controller;

import com.cfs.BOOKMYSHOW.dto.AuthResponse;
import com.cfs.BOOKMYSHOW.dto.LoginRequest;
import com.cfs.BOOKMYSHOW.dto.SignupRequest;
import com.cfs.BOOKMYSHOW.model.User;
import com.cfs.BOOKMYSHOW.repository.UserRepository;
import com.cfs.BOOKMYSHOW.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    // Mobile number registered hai ya nahi (login / signup step decide karne ke liye)
    @GetMapping("/check-phone")
    public ResponseEntity<Map<String, Boolean>> checkPhone(@RequestParam String phone) {
        return ResponseEntity.ok(Map.of("exists", userRepository.existsByPhoneNumber(phone.trim())));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        if (request.getPhoneNumber() != null && userRepository.existsByPhoneNumber(request.getPhoneNumber().trim())) {
            return ResponseEntity.badRequest().body("Mobile number already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // hash it!
        user.setPhoneNumber(request.getPhoneNumber() == null ? null : request.getPhoneNumber().trim());
        user.setRole("ROLE_USER");

        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole(), savedUser.getId());

        return ResponseEntity.ok(new AuthResponse(
                token, savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getRole()
        ));
    }

    // "email" field mein email ya 10 digit mobile number, dono chalenge
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        String identifier = request.getEmail() == null ? "" : request.getEmail().trim();
        String email = identifier;

        if (!identifier.contains("@")) {
            email = userRepository.findByPhoneNumber(identifier)
                    .map(User::getEmail)
                    .orElse(null);
            if (email == null) {
                return ResponseEntity.status(401).body("Invalid mobile number or password");
            }
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());

        return ResponseEntity.ok(new AuthResponse(
                token, user.getId(), user.getName(), user.getEmail(), user.getRole()
        ));
    }
}