package com.talenthunt.model;

import java.io.Serializable;
import java.sql.Timestamp;

public class Entry implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String competitionId;
    private String participantId;
    private String title;
    private String description;
    private String link;
    private Timestamp submittedAt;
    private Timestamp updatedAt;

    // Transient fields
    private String participantName;
    private String participantEmail;
    private int scoresCount;
    private double averageScore;
    private Score myScore;

    public Entry() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompetitionId() { return competitionId; }
    public void setCompetitionId(String competitionId) { this.competitionId = competitionId; }

    public String getParticipantId() { return participantId; }
    public void setParticipantId(String participantId) { this.participantId = participantId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }

    public Timestamp getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Timestamp submittedAt) { this.submittedAt = submittedAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public String getParticipantName() { return participantName; }
    public void setParticipantName(String participantName) { this.participantName = participantName; }

    public String getParticipantEmail() { return participantEmail; }
    public void setParticipantEmail(String participantEmail) { this.participantEmail = participantEmail; }

    public int getScoresCount() { return scoresCount; }
    public void setScoresCount(int scoresCount) { this.scoresCount = scoresCount; }

    public double getAverageScore() { return averageScore; }
    public void setAverageScore(double averageScore) { this.averageScore = averageScore; }

    public Score getMyScore() { return myScore; }
    public void setMyScore(Score myScore) { this.myScore = myScore; }
}
