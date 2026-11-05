package com.talenthunt.dao;

import com.talenthunt.model.Competition;
import com.talenthunt.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CompetitionDAO {

    public List<Competition> findAll(String currentUserId) {
        List<Competition> list = new ArrayList<>();
        String sql = "SELECT c.*, " +
                "(SELECT COUNT(*) FROM registrations r WHERE r.competition_id = c.id) AS reg_count, " +
                "(SELECT COUNT(*) FROM entries e WHERE e.competition_id = c.id) AS entry_count, " +
                "(SELECT COUNT(*) FROM competition_judges cj WHERE cj.competition_id = c.id) AS judge_count " +
                "FROM competitions c ORDER BY c.created_at DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Competition c = mapRow(rs);
                c.setRegisteredCount(rs.getInt("reg_count"));
                c.setEntriesCount(rs.getInt("entry_count"));
                c.setJudgesCount(rs.getInt("judge_count"));

                if (currentUserId != null) {
                    c.setRegistered(isParticipantRegistered(conn, c.getId(), currentUserId));
                }
                c.setJudgeNames(findJudgeNamesForComp(conn, c.getId()));
                list.add(c);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public Competition findById(String id) {
        String sql = "SELECT * FROM competitions WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Competition c = mapRow(rs);
                    c.setJudgeNames(findJudgeNamesForComp(conn, c.getId()));
                    return c;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean create(Competition comp) {
        String sql = "INSERT INTO competitions (id, title, category, description, rules, reg_deadline, sub_deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, comp.getId());
            ps.setString(2, comp.getTitle());
            ps.setString(3, comp.getCategory());
            ps.setString(4, comp.getDescription());
            ps.setString(5, comp.getRules());
            ps.setDate(6, comp.getRegDeadline());
            ps.setDate(7, comp.getSubDeadline());
            ps.setString(8, comp.getStatus());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean update(Competition comp) {
        String sql = "UPDATE competitions SET title = ?, category = ?, description = ?, rules = ?, reg_deadline = ?, sub_deadline = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, comp.getTitle());
            ps.setString(2, comp.getCategory());
            ps.setString(3, comp.getDescription());
            ps.setString(4, comp.getRules());
            ps.setDate(5, comp.getRegDeadline());
            ps.setDate(6, comp.getSubDeadline());
            ps.setString(7, comp.getId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateStatus(String compId, String status) {
        String sql = "UPDATE competitions SET status = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, compId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean delete(String compId) {
        String sql = "DELETE FROM competitions WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, compId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean assignJudges(String compId, List<String> judgeIds) {
        String delSql = "DELETE FROM competition_judges WHERE competition_id = ?";
        String insSql = "INSERT INTO competition_judges (competition_id, judge_id) VALUES (?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement delPs = conn.prepareStatement(delSql);
                 PreparedStatement insPs = conn.prepareStatement(insSql)) {

                delPs.setString(1, compId);
                delPs.executeUpdate();

                if (judgeIds != null) {
                    for (String jId : judgeIds) {
                        insPs.setString(1, compId);
                        insPs.setString(2, jId);
                        insPs.addBatch();
                    }
                    insPs.executeBatch();
                }
                conn.commit();
                return true;
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean registerParticipant(String regId, String compId, String participantId) {
        String sql = "INSERT INTO registrations (id, competition_id, participant_id) VALUES (?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, regId);
            ps.setString(2, compId);
            ps.setString(3, participantId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    private boolean isParticipantRegistered(Connection conn, String compId, String userId) throws SQLException {
        String sql = "SELECT 1 FROM registrations WHERE competition_id = ? AND participant_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, compId);
            ps.setString(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private List<String> findJudgeNamesForComp(Connection conn, String compId) throws SQLException {
        List<String> names = new ArrayList<>();
        String sql = "SELECT u.name FROM competition_judges cj JOIN users u ON cj.judge_id = u.id WHERE cj.competition_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, compId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    names.add(rs.getString("name"));
                }
            }
        }
        return names;
    }

    private Competition mapRow(ResultSet rs) throws SQLException {
        Competition c = new Competition();
        c.setId(rs.getString("id"));
        c.setTitle(rs.getString("title"));
        c.setCategory(rs.getString("category"));
        c.setDescription(rs.getString("description"));
        c.setRules(rs.getString("rules"));
        c.setRegDeadline(rs.getDate("reg_deadline"));
        c.setSubDeadline(rs.getDate("sub_deadline"));
        c.setStatus(rs.getString("status"));
        c.setCreatedAt(rs.getTimestamp("created_at"));
        return c;
    }
}
