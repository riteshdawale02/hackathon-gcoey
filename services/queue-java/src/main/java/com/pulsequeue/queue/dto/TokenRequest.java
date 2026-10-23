package com.pulsequeue.queue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class TokenRequest {

    @NotNull(message = "Patient ID is required")
    private Integer patientId;

    @NotBlank(message = "Patient name is required")
    private String patientName;

    @NotBlank(message = "Patient phone is required")
    private String patientPhone;

    @NotNull(message = "Department ID is required")
    private Integer departmentId;

    @NotBlank(message = "Department code is required")
    private String departmentCode;

    private String reasonForVisit;

    private Boolean isPriority = false;

    public TokenRequest() {}

    public Integer getPatientId() { return patientId; }
    public void setPatientId(Integer patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public Integer getDepartmentId() { return departmentId; }
    public void setDepartmentId(Integer departmentId) { this.departmentId = departmentId; }

    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }

    public String getReasonForVisit() { return reasonForVisit; }
    public void setReasonForVisit(String reasonForVisit) { this.reasonForVisit = reasonForVisit; }

    public Boolean getIsPriority() { return isPriority != null && isPriority; }
    public void setIsPriority(Boolean priority) { isPriority = priority; }
}
