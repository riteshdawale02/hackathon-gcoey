package com.pulsequeue.queue.controller;

import com.pulsequeue.queue.dto.CallNextRequest;
import com.pulsequeue.queue.dto.DepartmentStatsResponse;
import com.pulsequeue.queue.dto.DisplayQueueResponse;
import com.pulsequeue.queue.dto.TokenResponse;
import com.pulsequeue.queue.service.QueueService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/queue")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    // GET /api/queue/display - Live lobby TV waiting screen feed (polls every 5s)
    @GetMapping("/display")
    public ResponseEntity<DisplayQueueResponse> getDisplayQueue() {
        return ResponseEntity.ok(queueService.getDisplayQueue());
    }

    // GET /api/queue/department/{deptCode} - Detailed queue for a department
    @GetMapping("/department/{deptCode}")
    public ResponseEntity<Map<String, Object>> getDepartmentQueue(@PathVariable String deptCode) {
        return ResponseEntity.ok(queueService.getDepartmentQueue(deptCode));
    }

    // POST /api/queue/call-next - Doctor/Staff calls next patient
    @PostMapping("/call-next")
    public ResponseEntity<Map<String, Object>> callNext(@Valid @RequestBody CallNextRequest request) {
        return ResponseEntity.ok(queueService.callNext(request));
    }

    // POST /api/queue/tokens/{id}/complete - Mark consultation completed
    @PostMapping("/tokens/{id}/complete")
    public ResponseEntity<TokenResponse> completeToken(@PathVariable Long id) {
        return ResponseEntity.ok(queueService.completeToken(id));
    }

    // POST /api/queue/tokens/{id}/cancel - Mark no-show / cancelled
    @PostMapping("/tokens/{id}/cancel")
    public ResponseEntity<TokenResponse> cancelToken(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null) ? body.get("reason") : null;
        return ResponseEntity.ok(queueService.cancelToken(id, reason));
    }

    // GET /api/queue/statistics/{deptCode} - Department stats
    @GetMapping("/statistics/{deptCode}")
    public ResponseEntity<DepartmentStatsResponse> getDepartmentStats(@PathVariable String deptCode) {
        return ResponseEntity.ok(queueService.getDepartmentStats(deptCode));
    }

    // GET /api/queue/statistics - Overall hospital stats
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getOverallStats() {
        return ResponseEntity.ok(queueService.getOverallHospitalStats());
    }
}
