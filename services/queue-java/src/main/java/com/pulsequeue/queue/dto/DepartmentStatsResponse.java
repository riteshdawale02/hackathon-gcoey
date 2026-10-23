package com.pulsequeue.queue.dto;

public class DepartmentStatsResponse {

    private String departmentCode;
    private long waitingCount;
    private long inProgressCount;
    private long completedCount;
    private long totalToday;
    private double avgConsultationMinutes;
    private long estimatedWaitMinutes;

    public DepartmentStatsResponse() {}

    public DepartmentStatsResponse(String departmentCode, long waitingCount, long inProgressCount, long completedCount, double avgConsultationMinutes, long estimatedWaitMinutes) {
        this.departmentCode = departmentCode;
        this.waitingCount = waitingCount;
        this.inProgressCount = inProgressCount;
        this.completedCount = completedCount;
        this.totalToday = waitingCount + inProgressCount + completedCount;
        this.avgConsultationMinutes = avgConsultationMinutes;
        this.estimatedWaitMinutes = estimatedWaitMinutes;
    }

    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }

    public long getWaitingCount() { return waitingCount; }
    public void setWaitingCount(long waitingCount) { this.waitingCount = waitingCount; }

    public long getInProgressCount() { return inProgressCount; }
    public void setInProgressCount(long inProgressCount) { this.inProgressCount = inProgressCount; }

    public long getCompletedCount() { return completedCount; }
    public void setCompletedCount(long completedCount) { this.completedCount = completedCount; }

    public long getTotalToday() { return totalToday; }
    public void setTotalToday(long totalToday) { this.totalToday = totalToday; }

    public double getAvgConsultationMinutes() { return avgConsultationMinutes; }
    public void setAvgConsultationMinutes(double avgConsultationMinutes) { this.avgConsultationMinutes = avgConsultationMinutes; }

    public long getEstimatedWaitMinutes() { return estimatedWaitMinutes; }
    public void setEstimatedWaitMinutes(long estimatedWaitMinutes) { this.estimatedWaitMinutes = estimatedWaitMinutes; }
}
