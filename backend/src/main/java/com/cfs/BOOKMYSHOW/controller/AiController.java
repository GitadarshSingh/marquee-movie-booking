package com.cfs.BOOKMYSHOW.controller;

import com.cfs.BOOKMYSHOW.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, String> body) {
        String msg = body.getOrDefault("message", "").trim();
        if (msg.isEmpty() || msg.length() > 300) {
            return ResponseEntity.badRequest().body("Message 1-300 chars ka hona chahiye");
        }
        try {
            return ResponseEntity.ok(aiService.chat(msg));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("AI error: " + e.getMessage());
        }
    }
}