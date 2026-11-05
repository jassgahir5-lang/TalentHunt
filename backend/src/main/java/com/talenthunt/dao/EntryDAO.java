package com.talenthunt.dao;

import com.talenthunt.model.Entry;
import com.talenthunt.model.Score;
import com.talenthunt.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class EntryDAO {

    public List<Entry> findByCompetition(String compId, String currentJudgeId) {
        List<Entry> list = new ArrayList<>();
        String sql = "SELECT e.*, u.name AS part_name, u.email AS part_email, " +
                "(SELECT COUNT(*) FROM scores s WHERE s.entry_id = e.id) AS score_count, " +
                "(SELECT AVG(s.total) FROM scores s WHERE s.entry_id = e.id) AS avg_score " +
                "FROM entries e JOIN users u ON e.participant_id = u.id " +
                "WHERE e.competition_id = ? ORDER BY e.submitted_at ASC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, compId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Entry e = mapRow(rs);
                    e.setParticipantName(rs.getString("part_name"));
                    e.setParticipantEmail(rs.getString("part_email"));
                    e.setScoresCount(rs.getInt("score_count"));
                    e.setAverageScore(Math.round(rs.getDouble("avg_score") * 10.0) / 10.0);

                    if (currentJudgeId != null) {
                        e.setMyScore(findJudgeScoreForEntry(conn, e.getId(), currentJudgeId));
                    }
                    list.add(e);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public Entry findById(String id) {
        String sql = "SELECT e.*, u.name AS part_name, u.email AS part_email FROM entries e JOIN users u ON e.participant_id = u.id WHERE e.id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Entry e = mapRow(rs);
                    e.setParticipantName(rs.getString("part_name"));
                    e.setParticipantEmail(rs.getString("part_email"));
                    return e;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean upsert(Entry entry) {
        String sql = "INSERT INTO entries (id, competition_id, participant_id, title, description, link) " +
                "VALUES (?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), link = VALUES(link)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entry.getId());
            ps.setString(2, entry.getCompetitionId());
            ps.setString(3, entry.getParticipantId());
            ps.setString(4, entry.getTitle());
            ps.setString(5, entry.getDescription());
            ps.setString(6, entry.getLink());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean hasScores(String entryId) {
        String sql = "SELECT 1 FROM scores WHERE entry_id = ? LIMIT 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entryId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    private Score findJudgeScoreForEntry(Connection conn, String entryId, String judgeId) throws SQLException {
        String sql = "SELECT * FROM scores WHERE entry_id = ? AND judge_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entryId);
            ps.setString(2, judgeId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Score s = new Score();
                    s.setId(rs.getString("id"));
                    s.setEntryId(rs.getString("entry_id"));
                    s.setJudgeId(rs.getString("judge_id"));
                    s.setCreativity(rs.getDouble("creativity"));
                    s.setSkill(rs.getDouble("skill"));
                    s.setPresentation(rs.getDouble("presentation"));
                    s.setTotal(rs.getDouble("total"));
                    s.setComments(rs.getString("comments"));
                    s.setScoredAt(rs.getTimestamp("scored_at"));
                    return s;
                }
            }
        }
        return null;
    }

    private Entry mapRow(ResultSet rs) throws SQLException {
        Entry e = new Entry();
        e.setId(rs.getString("id"));
        e.setCompetitionId(rs.getString("competition_id"));
        e.setParticipantId(rs.getString("participant_id"));
        e.setTitle(rs.getString("title"));
        e.setDescription(rs.getString("description"));
        e.setLink(rs.getString("link"));
        e.setSubmittedAt(rs.getTimestamp("submitted_at"));
        e.setUpdatedAt(rs.getTimestamp("updated_at"));
        return e;
    }
}
