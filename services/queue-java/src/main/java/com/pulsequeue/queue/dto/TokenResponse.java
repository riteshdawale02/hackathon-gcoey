package com.pulsequeue.queue.dto;

import com.pulsequeue.queue.model.Token;
import com.pulsequeue.queue.model.TokenStatus;
import java.time.LocalDateTime;

public class TokenResponse {

    private Long id;
    private String tokenNumber;
    private String departmentCode;
    private Integer departmentId;
    private Integer patientId;
    private String patientName;
    private String patientPhone;
    private String reasonForVisit;
    private TokenStatus status;
    private Boolean isPriority;
    private Integer doctorId;
    private String doctorName;
    private String roomNumber;
    private long patientsAhead;
    private long estimatedWaitMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime calledAt;
    private LocalDateTime completedAt;

    public static TokenResponse fromEntity(Token token, long patientsAhead, long estimatedWaitMinutes) {
        TokenResponse res = new TokenResponse();
        res.setId(token.getId());
        res.setTokenNumber(token.getTokenNumber());
        res.setDepartmentCode(token.getDepartmentCode());
        res.setDepartmentId(token.getDepartmentId());
        res.setPatientId(token.getPatientId());
        res.setPatientName(token.getPatientName());
        res.setPatientPhone(token.getPatientPhone());
        res.setReasonForVisit(token.getReasonForVisit());
        res.setStatus(token.getStatus());
        res.setIsPriority(token.getIsPriority());
        res.setDoctorId(token.getDoctorId());
        res.setDoctorName(token.getDoctorName());
        res.setRoomNumber(token.getRoomNumber());
        res.setPatientsAhead(patientsAhead);
        res.setEstimatedWaitMinutes(estimatedWaitMinutes);
        res.setCreatedAt(token.getCreatedAt());
        res.setCalledAt(token.getCalledAt());
        res.setCompletedAt(token.getCompletedAt());
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }

    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }

    public Integer getDepartmentId() { return departmentId; }
    public void setDepartmentId(Integer departmentId) { this.departmentId = departmentId; }

    public Integer getPatientId() { return patientId; }
    public void setPatientId(Integer patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getReasonForVisit() { return reasonForVisit; }
    public void setReasonForVisit(String reasonForVisit) { this.reasonForVisit = reasonForVisit; }

    public TokenStatus getStatus() { return status; }
    public void setStatus(TokenStatus status) { this.status = status; }

    public Boolean getIsPriority() { return isPriority; }
    public void setIsPriority(Boolean priority) { isPriority = priority; }

    public Integer getDoctorId() { return doctorId; }
    public void setDoctorId(Integer doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public long getPatientsAhead() { return patientsAhead; }
    public void setPatientsAhead(long patientsAhead) { this.patientsAhead = patientsAhead; }

    public long getEstimatedWaitMinutes() { return estimatedWaitMinutes; }
    public void setEstimatedWaitMinutes(long estimatedWaitMinutes) { this.estimatedWaitMinutes = estimatedWaitMinutes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCalledAt() { return calledAt; }
    public void setCalledAt(LocalDateTime calledAt) { this.calledAt = calledAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
