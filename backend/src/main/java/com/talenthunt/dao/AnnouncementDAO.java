package com.talenthunt.dao;

import com.talenthunt.model.Announcement;
import com.talenthunt.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AnnouncementDAO {

    public List<Announcement> findAll() {
        List<Announcement> list = new ArrayList<>();
        String sql = "SELECT * FROM announcements ORDER BY created_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Announcement a = new Announcement();
                a.setId(rs.getString("id"));
                a.setTitle(rs.getString("title"));
                a.setContent(rs.getString("content"));
                a.setAuthorName(rs.getString("author_name"));
                a.setPriority(rs.getString("priority"));
                a.setCreatedAt(rs.getTimestamp("created_at"));
                list.add(a);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean create(Announcement a) {
        String sql = "INSERT INTO announcements (id, title, content, author_name, priority) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, a.getId());
            ps.setString(2, a.getTitle());
            ps.setString(3, a.getContent());
            ps.setString(4, a.getAuthorName());
            ps.setString(5, a.getPriority());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}
