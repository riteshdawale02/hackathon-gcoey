package com.pulsequeue.queue.repository;

import com.pulsequeue.queue.model.Token;
import com.pulsequeue.queue.model.TokenStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TokenRepository extends JpaRepository<Token, Long> {

    Optional<Token> findByTokenNumberAndTokenDate(String tokenNumber, LocalDate tokenDate);

    Optional<Token> findTopByTokenNumberOrderByCreatedAtDesc(String tokenNumber);

    List<Token> findByDepartmentCodeAndTokenDateOrderByCreatedAtAsc(String departmentCode, LocalDate tokenDate);

    List<Token> findByDepartmentCodeAndTokenDateAndStatusOrderByCreatedAtAsc(String departmentCode, LocalDate tokenDate, TokenStatus status);

    List<Token> findByTokenDateAndStatusOrderByCalledAtDesc(LocalDate tokenDate, TokenStatus status);

    // Find in-progress token for a specific doctor
    Optional<Token> findByDoctorIdAndStatusAndTokenDate(Integer doctorId, TokenStatus status, LocalDate tokenDate);

    // Find next waiting token: priority first, then oldest created
    @Query("SELECT t FROM Token t WHERE t.departmentCode = :deptCode AND t.tokenDate = :tokenDate AND t.status = 'WAITING' ORDER BY t.isPriority DESC, t.createdAt ASC")
    List<Token> findWaitingQueueOrdered(@Param("deptCode") String deptCode, @Param("tokenDate") LocalDate tokenDate);

    // Count tokens ahead of a specific token
    @Query("SELECT COUNT(t) FROM Token t WHERE t.departmentCode = :deptCode AND t.tokenDate = :tokenDate AND t.status = 'WAITING' AND ((t.isPriority = true AND :isPriority = false) OR (t.isPriority = :isPriority AND t.createdAt < :createdAt))")
    long countTokensAhead(@Param("deptCode") String deptCode, @Param("tokenDate") LocalDate tokenDate, @Param("isPriority") boolean isPriority, @Param("createdAt") java.time.LocalDateTime createdAt);

    long countByDepartmentCodeAndTokenDateAndStatus(String departmentCode, LocalDate tokenDate, TokenStatus status);

    long countByTokenDateAndStatus(LocalDate tokenDate, TokenStatus status);

    @Query("SELECT t FROM Token t WHERE t.tokenDate = :tokenDate AND t.status IN ('WAITING', 'IN_PROGRESS') ORDER BY t.calledAt DESC NULLS LAST, t.isPriority DESC, t.createdAt ASC")
    List<Token> findActiveTokensForDisplay(@Param("tokenDate") LocalDate tokenDate);

    @Query("SELECT t FROM Token t WHERE t.tokenDate = :tokenDate AND t.status = 'COMPLETED' AND t.calledAt IS NOT NULL AND t.completedAt IS NOT NULL")
    List<Token> findCompletedWithTimestamps(@Param("tokenDate") LocalDate tokenDate);

    @Query("SELECT t FROM Token t WHERE t.departmentCode = :deptCode AND t.tokenDate = :tokenDate AND t.status = 'COMPLETED' AND t.calledAt IS NOT NULL AND t.completedAt IS NOT NULL")
    List<Token> findCompletedByDepartmentWithTimestamps(@Param("deptCode") String deptCode, @Param("tokenDate") LocalDate tokenDate);
}
