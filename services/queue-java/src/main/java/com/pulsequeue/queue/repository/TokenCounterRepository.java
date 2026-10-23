package com.pulsequeue.queue.repository;

import com.pulsequeue.queue.model.TokenCounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface TokenCounterRepository extends JpaRepository<TokenCounter, Long> {
    Optional<TokenCounter> findByDepartmentCodeAndCounterDate(String departmentCode, LocalDate counterDate);
}
