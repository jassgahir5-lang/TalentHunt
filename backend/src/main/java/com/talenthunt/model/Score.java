package com.talenthunt.model;

import java.io.Serializable;
import java.sql.Timestamp;

public class Score implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String entryId;
    private String judgeId;
    private double creativity;
    private double skill;
    private double presentation;
    private double total;
    private String comments;
    private Timestamp scoredAt;

    public Score() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEntryId() { return entryId; }
    public void setEntryId(String entryId) { this.entryId = entryId; }

    public String getJudgeId() { return judgeId; }
    public void setJudgeId(String judgeId) { this.judgeId = judgeId; }

    public double getCreativity() { return creativity; }
    public void setCreativity(double creativity) { this.creativity = creativity; }

    public double getSkill() { return skill; }
    public void setSkill(double skill) { this.skill = skill; }

    public double getPresentation() { return presentation; }
    public void setPresentation(double presentation) { this.presentation = presentation; }

    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public Timestamp getScoredAt() { return scoredAt; }
    public void setScoredAt(Timestamp scoredAt) { this.scoredAt = scoredAt; }
}
