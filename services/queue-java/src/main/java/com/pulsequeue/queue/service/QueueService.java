package com.pulsequeue.queue.service;

import com.pulsequeue.queue.dto.*;
import com.pulsequeue.queue.model.Token;
import com.pulsequeue.queue.model.TokenCounter;
import com.pulsequeue.queue.model.TokenStatus;
import com.pulsequeue.queue.repository.TokenCounterRepository;
import com.pulsequeue.queue.repository.TokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QueueService {

    private final TokenRepository tokenRepository;
    private final TokenCounterRepository tokenCounterRepository;

    private static final double DEFAULT_AVG_CONSULTATION_MINUTES = 10.0;

    public QueueService(TokenRepository tokenRepository, TokenCounterRepository tokenCounterRepository) {
        this.tokenRepository = tokenRepository;
        this.tokenCounterRepository = tokenCounterRepository;
    }

    @Transactional
    public TokenResponse generateToken(TokenRequest request) {
        LocalDate today = LocalDate.now();
        String deptCode = request.getDepartmentCode().toUpperCase().trim();

        // 1. Daily atomic sequence generation
        TokenCounter counter = tokenCounterRepository.findByDepartmentCodeAndCounterDate(deptCode, today)
                .orElseGet(() -> new TokenCounter(deptCode, today, 0));

        int nextSeq = counter.getLastSequence() + 1;
        counter.setLastSequence(nextSeq);
        tokenCounterRepository.save(counter);

        // e.g. "CARD-014"
        String formattedTokenNumber = String.format("%s-%03d", deptCode, nextSeq);

        Token token = new Token();
        token.setTokenNumber(formattedTokenNumber);
        token.setDepartmentCode(deptCode);
        token.setDepartmentId(request.getDepartmentId());
        token.setPatientId(request.getPatientId());
        token.setPatientName(request.getPatientName());
        token.setPatientPhone(request.getPatientPhone());
        token.setReasonForVisit(request.getReasonForVisit());
        token.setStatus(TokenStatus.WAITING);
        token.setIsPriority(request.getIsPriority());
        token.setTokenDate(today);
        token.setCreatedAt(LocalDateTime.now());

        Token saved = tokenRepository.save(token);

        long ahead = calculatePatientsAhead(saved);
        long waitTime = calculateEstimatedWait(saved, ahead);

        return TokenResponse.fromEntity(saved, ahead, waitTime);
    }

    public Optional<TokenResponse> getTokenStatus(String tokenNumber) {
        LocalDate today = LocalDate.now();
        return tokenRepository.findByTokenNumberAndTokenDate(tokenNumber, today)
                .or(() -> tokenRepository.findTopByTokenNumberOrderByCreatedAtDesc(tokenNumber))
                .map(token -> {
                    long ahead = (token.getStatus() == TokenStatus.WAITING) ? calculatePatientsAhead(token) : 0;
                    long waitTime = (token.getStatus() == TokenStatus.WAITING) ? calculateEstimatedWait(token, ahead) : 0;
                    return TokenResponse.fromEntity(token, ahead, waitTime);
                });
    }

    @Transactional
    public Map<String, Object> callNext(CallNextRequest request) {
        LocalDate today = LocalDate.now();
        String deptCode = request.getDepartmentCode().toUpperCase().trim();

        // 1. Complete previous IN_PROGRESS token for this doctor, if any
        boolean previousCompleted = false;
        Optional<Token> activeToken = tokenRepository.findByDoctorIdAndStatusAndTokenDate(
                request.getDoctorId(), TokenStatus.IN_PROGRESS, today);

        if (activeToken.isPresent()) {
            Token prev = activeToken.get();
            prev.setStatus(TokenStatus.COMPLETED);
            prev.setCompletedAt(LocalDateTime.now());
            tokenRepository.save(prev);
            previousCompleted = true;
        }

        // 2. Fetch next WAITING token (Priority first, then FIFO)
        List<Token> waitingQueue = tokenRepository.findWaitingQueueOrdered(deptCode, today);
        if (waitingQueue.isEmpty()) {
            Map<String, Object> emptyRes = new HashMap<>();
            emptyRes.put("message", "No waiting patients for department " + deptCode);
            emptyRes.put("calledToken", null);
            emptyRes.put("previousTokenCompleted", previousCompleted);
            return emptyRes;
        }

        Token nextToken = waitingQueue.get(0);
        nextToken.setStatus(TokenStatus.IN_PROGRESS);
        nextToken.setDoctorId(request.getDoctorId());
        nextToken.setDoctorName(request.getDoctorName());
        nextToken.setRoomNumber(request.getRoomNumber());
        nextToken.setCalledAt(LocalDateTime.now());
        Token updated = tokenRepository.save(nextToken);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Token " + updated.getTokenNumber() + " called successfully");
        res.put("calledToken", TokenResponse.fromEntity(updated, 0, 0));
        res.put("previousTokenCompleted", previousCompleted);
        return res;
    }

    @Transactional
    public TokenResponse completeToken(Long tokenId) {
        Token token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Token not found: " + tokenId));

        token.setStatus(TokenStatus.COMPLETED);
        token.setCompletedAt(LocalDateTime.now());
        Token saved = tokenRepository.save(token);
        return TokenResponse.fromEntity(saved, 0, 0);
    }

    @Transactional
    public TokenResponse cancelToken(Long tokenId, String reason) {
        Token token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Token not found: " + tokenId));

        token.setStatus(TokenStatus.CANCELLED);
        if (reason != null && !reason.isBlank()) {
            token.setReasonForVisit((token.getReasonForVisit() != null ? token.getReasonForVisit() + " | Cancelled: " : "Cancelled: ") + reason);
        }
        Token saved = tokenRepository.save(token);
        return TokenResponse.fromEntity(saved, 0, 0);
    }

    public Map<String, Object> getDepartmentQueue(String deptCode) {
        LocalDate today = LocalDate.now();
        String code = deptCode.toUpperCase().trim();

        List<Token> allToday = tokenRepository.findByDepartmentCodeAndTokenDateOrderByCreatedAtAsc(code, today);

        List<TokenResponse> inProgress = allToday.stream()
                .filter(t -> t.getStatus() == TokenStatus.IN_PROGRESS)
                .map(t -> TokenResponse.fromEntity(t, 0, 0))
                .collect(Collectors.toList());

        List<Token> waitingTokens = allToday.stream()
                .filter(t -> t.getStatus() == TokenStatus.WAITING)
                .sorted(Comparator.comparing(Token::getIsPriority).reversed()
                        .thenComparing(Token::getCreatedAt))
                .collect(Collectors.toList());

        double avgTime = calculateAverageConsultationMinutes(code);

        List<TokenResponse> waiting = new ArrayList<>();
        for (int i = 0; i < waitingTokens.size(); i++) {
            Token t = waitingTokens.get(i);
            long ahead = i;
            long estimatedWait = Math.round(ahead * avgTime);
            waiting.add(TokenResponse.fromEntity(t, ahead, estimatedWait));
        }

        List<TokenResponse> completed = allToday.stream()
                .filter(t -> t.getStatus() == TokenStatus.COMPLETED)
                .sorted(Comparator.comparing(Token::getCompletedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(t -> TokenResponse.fromEntity(t, 0, 0))
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("departmentCode", code);
        result.put("inProgress", inProgress);
        result.put("waiting", waiting);
        result.put("completed", completed);
        result.put("stats", getDepartmentStats(code));
        return result;
    }

    public DisplayQueueResponse getDisplayQueue() {
        LocalDate today = LocalDate.now();
        List<Token> active = tokenRepository.findActiveTokensForDisplay(today);

        List<DisplayQueueResponse.ActiveCall> nowServing = active.stream()
                .filter(t -> t.getStatus() == TokenStatus.IN_PROGRESS)
                .map(t -> new DisplayQueueResponse.ActiveCall(
                        t.getTokenNumber(),
                        t.getDepartmentCode(),
                        t.getPatientName(),
                        t.getDoctorName() != null ? t.getDoctorName() : "Doctor",
                        t.getRoomNumber() != null ? t.getRoomNumber() : "Consultation Room",
                        t.getCalledAt()
                ))
                .collect(Collectors.toList());

        List<Token> waitingTokens = active.stream()
                .filter(t -> t.getStatus() == TokenStatus.WAITING)
                .collect(Collectors.toList());

        List<DisplayQueueResponse.UpcomingToken> upcoming = new ArrayList<>();
        for (int i = 0; i < Math.min(waitingTokens.size(), 12); i++) {
            Token t = waitingTokens.get(i);
            upcoming.add(new DisplayQueueResponse.UpcomingToken(
                    t.getTokenNumber(),
                    t.getDepartmentCode(),
                    t.getIsPriority(),
                    i + 1
            ));
        }

        return new DisplayQueueResponse(nowServing, upcoming);
    }

    public DepartmentStatsResponse getDepartmentStats(String deptCode) {
        LocalDate today = LocalDate.now();
        String code = deptCode.toUpperCase().trim();

        long waiting = tokenRepository.countByDepartmentCodeAndTokenDateAndStatus(code, today, TokenStatus.WAITING);
        long inProgress = tokenRepository.countByDepartmentCodeAndTokenDateAndStatus(code, today, TokenStatus.IN_PROGRESS);
        long completed = tokenRepository.countByDepartmentCodeAndTokenDateAndStatus(code, today, TokenStatus.COMPLETED);

        double avgConsultation = calculateAverageConsultationMinutes(code);
        long estimatedWait = Math.round(waiting * avgConsultation);

        return new DepartmentStatsResponse(code, waiting, inProgress, completed, avgConsultation, estimatedWait);
    }

    public Map<String, Object> getOverallHospitalStats() {
        LocalDate today = LocalDate.now();
        long totalWaiting = tokenRepository.countByTokenDateAndStatus(today, TokenStatus.WAITING);
        long totalInProgress = tokenRepository.countByTokenDateAndStatus(today, TokenStatus.IN_PROGRESS);
        long totalCompleted = tokenRepository.countByTokenDateAndStatus(today, TokenStatus.COMPLETED);

        Map<String, Object> map = new HashMap<>();
        map.put("totalWaiting", totalWaiting);
        map.put("totalInProgress", totalInProgress);
        map.put("totalCompleted", totalCompleted);
        map.put("totalToday", totalWaiting + totalInProgress + totalCompleted);
        return map;
    }

    public double calculateAverageConsultationMinutes(String deptCode) {
        LocalDate today = LocalDate.now();
        List<Token> completedList = tokenRepository.findCompletedByDepartmentWithTimestamps(deptCode, today);

        if (completedList.isEmpty()) {
            return DEFAULT_AVG_CONSULTATION_MINUTES;
        }

        double totalMinutes = completedList.stream()
                .mapToDouble(t -> {
                    long seconds = Duration.between(t.getCalledAt(), t.getCompletedAt()).getSeconds();
                    return Math.max(1.0, seconds / 60.0);
                })
                .average()
                .orElse(DEFAULT_AVG_CONSULTATION_MINUTES);

        return Math.round(totalMinutes * 10.0) / 10.0;
    }

    private long calculatePatientsAhead(Token token) {
        return tokenRepository.countTokensAhead(
                token.getDepartmentCode(),
                token.getTokenDate(),
                Boolean.TRUE.equals(token.getIsPriority()),
                token.getCreatedAt()
        );
    }

    private long calculateEstimatedWait(Token token, long patientsAhead) {
        double avg = calculateAverageConsultationMinutes(token.getDepartmentCode());
        return Math.round(patientsAhead * avg);
    }
}
