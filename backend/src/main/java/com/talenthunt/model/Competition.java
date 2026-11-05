package com.talenthunt.model;

import java.io.Serializable;
import java.sql.Date;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class Competition implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String title;
    private String category;
    private String description;
    private String rules;
    private Date regDeadline;
    private Date subDeadline;
    private String status; // "Open", "Closed", "Published"
    private Timestamp createdAt;

    // Transient presentation fields
    private int registeredCount;
    private int entriesCount;
    private int judgesCount;
    private List<String> assignedJudgeIds = new ArrayList<>();
    private List<String> judgeNames = new ArrayList<>();
    private boolean isRegistered;

    public Competition() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRules() { return rules; }
    public void setRules(String rules) { this.rules = rules; }

    public Date getRegDeadline() { return regDeadline; }
    public void setRegDeadline(Date regDeadline) { this.regDeadline = regDeadline; }

    public Date getSubDeadline() { return subDeadline; }
    public void setSubDeadline(Date subDeadline) { this.subDeadline = subDeadline; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public int getRegisteredCount() { return registeredCount; }
    public void setRegisteredCount(int registeredCount) { this.registeredCount = registeredCount; }

    public int getEntriesCount() { return entriesCount; }
    public void setEntriesCount(int entriesCount) { this.entriesCount = entriesCount; }

    public int getJudgesCount() { return judgesCount; }
    public void setJudgesCount(int judgesCount) { this.judgesCount = judgesCount; }

    public List<String> getAssignedJudgeIds() { return assignedJudgeIds; }
    public void setAssignedJudgeIds(List<String> assignedJudgeIds) { this.assignedJudgeIds = assignedJudgeIds; }

    public List<String> getJudgeNames() { return judgeNames; }
    public void setJudgeNames(List<String> judgeNames) { this.judgeNames = judgeNames; }

    public boolean isRegistered() { return isRegistered; }
    public void setRegistered(boolean registered) { isRegistered = registered; }
}
