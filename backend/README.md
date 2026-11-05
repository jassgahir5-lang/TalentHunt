# TalentHunt - Java Servlets & Apache Tomcat Backend

This directory contains the production-grade **Java Servlets (Jakarta EE) + JDBC + MySQL** backend for the **TalentHunt** Online Talent Hunt and Competition Management Platform.

---

## 📁 Architecture & Package Structure

```
backend/
├── pom.xml                                      # Maven project configuration
├── README.md                                    # This setup & evaluation guide
└── src/
    └── main/
        ├── resources/
        │   └── schema.sql                       # MySQL table DDL, triggers & seed data
        ├── webapp/
        │   └── WEB-INF/
        │       └── web.xml                      # Servlet mapping & filter deployment descriptor
        └── java/
            └── com/
                └── talenthunt/
                    ├── model/                   # JavaBean Entity models
                    │   ├── User.java
                    │   ├── Competition.java
                    │   ├── Entry.java
                    │   ├── Score.java
                    │   └── Announcement.java
                    ├── util/                    # Utilities & connection pooling
                    │   ├── DBConnection.java    # HikariCP DataSource pool
                    │   └── PasswordUtil.java    # SHA-256 password hashing
                    ├── dao/                     # Data Access Objects (JDBC PreparedStatements)
                    │   ├── UserDAO.java
                    │   ├── CompetitionDAO.java
                    │   ├── EntryDAO.java
                    │   ├── ScoreDAO.java
                    │   └── AnnouncementDAO.java
                    ├── filter/                  # Request filters
                    │   └── AuthFilter.java      # CORS and UTF-8 encoding filter
                    └── servlet/                 # HTTP Controllers (HttpServlet)
                        ├── AuthServlet.java     # /api/auth/*
                        ├── CompetitionServlet.java # /api/competitions/*
                        ├── EntryServlet.java    # /api/entries/*
                        ├── UserServlet.java     # /api/users/*
                        ├── AnnouncementServlet.java # /api/announcements
                        └── PublicStatsServlet.java # /api/public/stats
```

---

## 🛠️ Prerequisites

1. **Java Development Kit (JDK 17 or higher)**
2. **Apache Tomcat 10.x** (supports `jakarta.servlet` specification; or Tomcat 9 with `javax.servlet`)
3. **MySQL Server 8.x**
4. **Apache Maven 3.8+** or Eclipse IDE for Enterprise Java / IntelliJ IDEA Ultimate

---

## 🚀 Step-by-Step Setup Guide

### 1. Database Setup
1. Open MySQL Workbench or your terminal:
   ```bash
   mysql -u root -p
   ```
2. Execute the included SQL script:
   ```sql
   SOURCE backend/src/main/resources/schema.sql;
   ```
   This creates the `talenthunt_db` database, tables with foreign keys and cascade rules, and inserts the pre-seeded admin, judges, participants, and competitions.

### 2. Configure Database Credentials
Edit `backend/src/main/java/com/talenthunt/util/DBConnection.java` or set environment variables:
```bash
export JDBC_DATABASE_URL="jdbc:mysql://localhost:3306/talenthunt_db?useSSL=false&serverTimezone=UTC"
export DB_USER="root"
export DB_PASSWORD="your_mysql_password"
```

### 3. Build WAR with Maven
In the `backend/` directory:
```bash
mvn clean package
```
This produces `target/talenthunt.war`.

### 4. Deploy to Apache Tomcat
- Copy `target/talenthunt.war` into your Tomcat `webapps/` directory:
  ```bash
  cp target/talenthunt.war /path/to/apache-tomcat/webapps/
  ```
- Start Tomcat:
  ```bash
  /path/to/apache-tomcat/bin/startup.sh   # Linux/macOS
  /path/to/apache-tomcat/bin/startup.bat  # Windows
  ```
- Test endpoint: `http://localhost:8080/talenthunt/api/public/stats`

### 5. Connect Frontend to the Java Servlet Backend
In `js/app.js`:
Set:
```javascript
const USE_MOCK = false;
```
Now all `api()` calls in the frontend will communicate directly with your Java Tomcat server endpoints via `fetch('/api' + path)`!
