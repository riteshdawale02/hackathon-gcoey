package com.pulsequeue.queue.controller;

import com.pulsequeue.queue.dto.TokenRequest;
import com.pulsequeue.queue.dto.TokenResponse;
import com.pulsequeue.queue.service.QueueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tokens")
public class TokenController {

    private final QueueService queueService;

    public TokenController(QueueService queueService) {
        this.queueService = queueService;
    }

    // POST /api/tokens - Generate a new token
    @PostMapping
    public ResponseEntity<TokenResponse> generateToken(@Valid @RequestBody TokenRequest request) {
        TokenResponse response = queueService.generateToken(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // GET /api/tokens/{tokenNumber} - Get token status & position
    @GetMapping("/{tokenNumber}")
    public ResponseEntity<?> getTokenStatus(@PathVariable String tokenNumber) {
        return queueService.getTokenStatus(tokenNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(java.util.Collections.singletonMap("error", "Token " + tokenNumber + " not found")));
    }
}
