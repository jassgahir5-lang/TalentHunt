package com.talenthunt.util;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.SQLException;

public class DBConnection {
    private static HikariDataSource dataSource;

    static {
        try {
            HikariConfig config = new HikariConfig();
            String jdbcUrl = System.getenv("JDBC_DATABASE_URL");
            if (jdbcUrl == null || jdbcUrl.isEmpty()) {
                jdbcUrl = "jdbc:mysql://localhost:3306/talenthunt_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
            }
            config.setJdbcUrl(jdbcUrl);
            config.setUsername(System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "root");
            config.setPassword(System.getenv("DB_PASSWORD") != null ? System.getenv("DB_PASSWORD") : "root123");
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setConnectionTimeout(20000);
            config.setMaxLifetime(1800000);

            dataSource = new HikariDataSource(config);
        } catch (Exception e) {
            System.err.println("Database pool initialization error: " + e.getMessage());
        }
    }

    public static Connection getConnection() throws SQLException {
        if (dataSource != null) {
            return dataSource.getConnection();
        }
        throw new SQLException("HikariCP DataSource is not initialized.");
    }

    public static void closePool() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }
}
