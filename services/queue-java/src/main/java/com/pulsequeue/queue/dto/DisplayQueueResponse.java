package com.pulsequeue.queue.dto;

import java.time.LocalDateTime;
import java.util.List;

public class DisplayQueueResponse {

    public static class ActiveCall {
        private String tokenNumber;
        private String departmentCode;
        private String patientName;
        private String doctorName;
        private String roomNumber;
        private LocalDateTime calledAt;

        public ActiveCall() {}

        public ActiveCall(String tokenNumber, String departmentCode, String patientName, String doctorName, String roomNumber, LocalDateTime calledAt) {
            this.tokenNumber = tokenNumber;
            this.departmentCode = departmentCode;
            this.patientName = patientName;
            this.doctorName = doctorName;
            this.roomNumber = roomNumber;
            this.calledAt = calledAt;
        }

        public String getTokenNumber() { return tokenNumber; }
        public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }

        public String getDepartmentCode() { return departmentCode; }
        public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }

        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }

        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

        public String getRoomNumber() { return roomNumber; }
        public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

        public LocalDateTime getCalledAt() { return calledAt; }
        public void setCalledAt(LocalDateTime calledAt) { this.calledAt = calledAt; }
    }

    public static class UpcomingToken {
        private String tokenNumber;
        private String departmentCode;
        private Boolean isPriority;
        private long position;

        public UpcomingToken() {}

        public UpcomingToken(String tokenNumber, String departmentCode, Boolean isPriority, long position) {
            this.tokenNumber = tokenNumber;
            this.departmentCode = departmentCode;
            this.isPriority = isPriority;
            this.position = position;
        }

        public String getTokenNumber() { return tokenNumber; }
        public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }

        public String getDepartmentCode() { return departmentCode; }
        public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }

        public Boolean getIsPriority() { return isPriority; }
        public void setIsPriority(Boolean priority) { isPriority = priority; }

        public long getPosition() { return position; }
        public void setPosition(long position) { this.position = position; }
    }

    private List<ActiveCall> nowServing;
    private List<UpcomingToken> upcoming;
    private LocalDateTime timestamp = LocalDateTime.now();

    public DisplayQueueResponse() {}

    public DisplayQueueResponse(List<ActiveCall> nowServing, List<UpcomingToken> upcoming) {
        this.nowServing = nowServing;
        this.upcoming = upcoming;
    }

    public List<ActiveCall> getNowServing() { return nowServing; }
    public void setNowServing(List<ActiveCall> nowServing) { this.nowServing = nowServing; }

    public List<UpcomingToken> getUpcoming() { return upcoming; }
    public void setUpcoming(List<UpcomingToken> upcoming) { this.upcoming = upcoming; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
