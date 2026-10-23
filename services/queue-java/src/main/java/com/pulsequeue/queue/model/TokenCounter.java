package com.pulsequeue.queue.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "token_counters", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"department_code", "counter_date"})
})
public class TokenCounter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "department_code", nullable = false)
    private String departmentCode;

    @Column(name = "counter_date", nullable = false)
    private LocalDate counterDate;

    @Column(name = "last_sequence", nullable = false)
    private Integer lastSequence = 0;

    public TokenCounter() {}

    public TokenCounter(String departmentCode, LocalDate counterDate, Integer lastSequence) {
        this.departmentCode = departmentCode;
        this.counterDate = counterDate;
        this.lastSequence = lastSequence;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }

    public LocalDate getCounterDate() { return counterDate; }
    public void setCounterDate(LocalDate counterDate) { this.counterDate = counterDate; }

    public Integer getLastSequence() { return lastSequence; }
    public void setLastSequence(Integer lastSequence) { this.lastSequence = lastSequence; }
}
