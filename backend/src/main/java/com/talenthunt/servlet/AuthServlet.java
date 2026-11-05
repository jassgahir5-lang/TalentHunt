package com.talenthunt.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.talenthunt.dao.UserDAO;
import com.talenthunt.model.User;
import com.talenthunt.util.PasswordUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.UUID;

public class AuthServlet extends HttpServlet {
    private final UserDAO userDAO = new UserDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        String pathInfo = req.getPathInfo(); // "/login", "/register", "/forgot", "/reset"

        if (pathInfo == null || pathInfo.equals("/")) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid authentication endpoint.");
            return;
        }

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        JsonObject body = gson.fromJson(sb.toString(), JsonObject.class);
        if (body == null) body = new JsonObject();

        switch (pathInfo) {
            case "/register":
                handleRegister(body, resp);
                break;
            case "/login":
                handleLogin(body, resp);
                break;
            case "/logout":
                handleLogout(resp);
                break;
            case "/forgot":
                handleForgot(body, resp);
                break;
            case "/reset":
                handleReset(body, resp);
                break;
            default:
                sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found: " + pathInfo);
        }
    }

    private void handleRegister(JsonObject body, HttpServletResponse resp) throws IOException {
        String name = body.has("name") ? body.get("name").getAsString().trim() : "";
        String email = body.has("email") ? body.get("email").getAsString().trim().toLowerCase() : "";
        String password = body.has("password") ? body.get("password").getAsString() : "";
        String role = body.has("role") ? body.get("role").getAsString() : "participant";

        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "All fields are required.");
            return;
        }

        if (password.length() < 8 || !password.matches(".*[A-Za-z].*") || !password.matches(".*[0-9].*")) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Password must be at least 8 characters with at least one letter and one number.");
            return;
        }

        if (userDAO.findByEmail(email) != null) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "An account with this email already exists.");
            return;
        }

        String passwordHash = PasswordUtil.hashPassword(password);
        String status = "judge".equalsIgnoreCase(role) ? "pending" : "approved";
        String id = "u_" + UUID.randomUUID().toString().substring(0, 8);

        User newUser = new User(id, name, email, passwordHash, role, status, null);
        boolean created = userDAO.create(newUser);

        if (!created) {
            sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Database failure while creating user.");
            return;
        }

        JsonObject responseObj = new JsonObject();
        if ("judge".equalsIgnoreCase(role)) {
            responseObj.addProperty("message", "Registration successful! Your judge account requires admin approval before you can log in.");
            responseObj.addProperty("requiresApproval", true);
        } else {
            String token = "th_tok_" + UUID.randomUUID().toString();
            responseObj.addProperty("message", "Registration successful! Welcome to TalentHunt.");
            responseObj.addProperty("token", token);
            JsonObject uObj = new JsonObject();
            uObj.addProperty("id", newUser.getId());
            uObj.addProperty("name", newUser.getName());
            uObj.addProperty("email", newUser.getEmail());
            uObj.addProperty("role", newUser.getRole());
            uObj.addProperty("status", newUser.getStatus());
            responseObj.add("user", uObj);
        }

        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().write(gson.toJson(responseObj));
    }

    private void handleLogin(JsonObject body, HttpServletResponse resp) throws IOException {
        String email = body.has("email") ? body.get("email").getAsString().trim().toLowerCase() : "";
        String password = body.has("password") ? body.get("password").getAsString() : "";

        if (email.isEmpty() || password.isEmpty()) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Email and password are required.");
            return;
        }

        User user = userDAO.findByEmail(email);
        if (user == null || !PasswordUtil.verifyPassword(password, user.getPasswordHash())) {
            sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Invalid email or password.");
            return;
        }

        if ("judge".equalsIgnoreCase(user.getRole()) && !"approved".equalsIgnoreCase(user.getStatus())) {
            sendError(resp, HttpServletResponse.SC_FORBIDDEN, "Your judge account is waiting for admin approval.");
            return;
        }

        String token = "th_tok_" + UUID.randomUUID().toString();
        JsonObject responseObj = new JsonObject();
        responseObj.addProperty("message", "Login successful");
        responseObj.addProperty("token", token);

        JsonObject uObj = new JsonObject();
        uObj.addProperty("id", user.getId());
        uObj.addProperty("name", user.getName());
        uObj.addProperty("email", user.getEmail());
        uObj.addProperty("role", user.getRole());
        uObj.addProperty("status", user.getStatus());
        responseObj.add("user", uObj);

        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().write(gson.toJson(responseObj));
    }

    private void handleLogout(HttpServletResponse resp) throws IOException {
        JsonObject res = new JsonObject();
        res.addProperty("message", "Logged out successfully");
        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().write(gson.toJson(res));
    }

    private void handleForgot(JsonObject body, HttpServletResponse resp) throws IOException {
        String email = body.has("email") ? body.get("email").getAsString().trim().toLowerCase() : "";
        String code = String.valueOf((int) (100000 + Math.random() * 900000));

        JsonObject res = new JsonObject();
        res.addProperty("message", "If this email is registered, a code has been generated.");
        res.addProperty("code", code);
        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().write(gson.toJson(res));
    }

    private void handleReset(JsonObject body, HttpServletResponse resp) throws IOException {
        String email = body.has("email") ? body.get("email").getAsString().trim().toLowerCase() : "";
        String newPassword = body.has("newPassword") ? body.get("newPassword").getAsString() : "";

        if (newPassword.length() < 8 || !newPassword.matches(".*[A-Za-z].*") || !newPassword.matches(".*[0-9].*")) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Password must be at least 8 characters with letters and numbers.");
            return;
        }

        String newHash = PasswordUtil.hashPassword(newPassword);
        userDAO.updatePassword(email, newHash);

        JsonObject res = new JsonObject();
        res.addProperty("message", "Password has been reset successfully. Please log in.");
        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().write(gson.toJson(res));
    }

    private void sendError(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        JsonObject err = new JsonObject();
        err.addProperty("message", message);
        resp.getWriter().write(gson.toJson(err));
    }
}
