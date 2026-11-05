package com.talenthunt.dao;

import com.talenthunt.model.Score;
import com.talenthunt.util.DBConnection;

import java.sql.*;

public class ScoreDAO {

    public boolean create(Score score) {
        String sql = "INSERT INTO scores (id, entry_id, judge_id, creativity, skill, presentation, total, comments) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, score.getId());
            ps.setString(2, score.getEntryId());
            ps.setString(3, score.getJudgeId());
            ps.setDouble(4, score.getCreativity());
            ps.setDouble(5, score.getSkill());
            ps.setDouble(6, score.getPresentation());
            ps.setDouble(7, score.getTotal());
            ps.setString(8, score.getComments());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean hasJudgeScored(String entryId, String judgeId) {
        String sql = "SELECT 1 FROM scores WHERE entry_id = ? AND judge_id = ? LIMIT 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entryId);
            ps.setString(2, judgeId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}
