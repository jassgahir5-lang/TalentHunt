package com.talenthunt.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import com.talenthunt.dao.CompetitionDAO;
import com.talenthunt.dao.EntryDAO;
import com.talenthunt.model.Competition;
import com.talenthunt.model.Entry;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.lang.reflect.Type;
import java.sql.Date;
import java.util.List;
import java.util.UUID;

public class CompetitionServlet extends HttpServlet {
    private final CompetitionDAO competitionDAO = new CompetitionDAO();
    private final EntryDAO entryDAO = new EntryDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        String pathInfo = req.getPathInfo(); // null or "/{id}", "/{id}/entries", "/{id}/leaderboard"

        if (pathInfo == null || pathInfo.equals("/")) {
            String currentUserId = req.getHeader("X-User-Id");
            List<Competition> list = competitionDAO.findAll(currentUserId);
            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().write(gson.toJson(list));
            return;
        }

        String[] parts = pathInfo.split("/");
        if (parts.length >= 2) {
            String compId = parts[1];
            if (parts.length == 3 && "entries".equalsIgnoreCase(parts[2])) {
                String judgeId = req.getHeader("X-User-Id");
                List<Entry> entries = entryDAO.findByCompetition(compId, judgeId);
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write(gson.toJson(entries));
                return;
            }

            Competition comp = competitionDAO.findById(compId);
            if (comp != null) {
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write(gson.toJson(comp));
            } else {
                sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Competition not found.");
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        String pathInfo = req.getPathInfo();
        JsonObject body = readJsonBody(req);

        if (pathInfo == null || pathInfo.equals("/")) {
            // Create new competition
            String title = body.has("title") ? body.get("title").getAsString().trim() : "";
            String category = body.has("category") ? body.get("category").getAsString() : "";
            String desc = body.has("description") ? body.get("description").getAsString() : "";
            String rules = body.has("rules") ? body.get("rules").getAsString() : "";
            String regDeadline = body.has("regDeadline") ? body.get("regDeadline").getAsString() : "";
            String subDeadline = body.has("subDeadline") ? body.get("subDeadline").getAsString() : "";

            if (title.isEmpty() || category.isEmpty() || regDeadline.isEmpty() || subDeadline.isEmpty()) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Title, category, and deadlines are required.");
                return;
            }

            Competition c = new Competition();
            c.setId("c_" + UUID.randomUUID().toString().substring(0, 8));
            c.setTitle(title);
            c.setCategory(category);
            c.setDescription(desc);
            c.setRules(rules);
            c.setRegDeadline(Date.valueOf(regDeadline));
            c.setSubDeadline(Date.valueOf(subDeadline));
            c.setStatus("Open");

            boolean ok = competitionDAO.create(c);
            if (ok) {
                resp.setStatus(HttpServletResponse.SC_CREATED);
                resp.getWriter().write(gson.toJson(c));
            } else {
                sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to create competition.");
            }
            return;
        }

        String[] parts = pathInfo.split("/");
        if (parts.length >= 3) {
            String compId = parts[1];
            String action = parts[2];

            if ("register".equalsIgnoreCase(action)) {
                String participantId = req.getHeader("X-User-Id");
                if (participantId == null) {
                    sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "User authentication required.");
                    return;
                }
                String regId = "reg_" + UUID.randomUUID().toString().substring(0, 8);
                boolean regOk = competitionDAO.registerParticipant(regId, compId, participantId);
                if (regOk) {
                    JsonObject res = new JsonObject();
                    res.addProperty("message", "Registered successfully!");
                    resp.setStatus(HttpServletResponse.SC_OK);
                    resp.getWriter().write(gson.toJson(res));
                } else {
                    sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Already registered or registration closed.");
                }
            } else if ("status".equalsIgnoreCase(action)) {
                String status = body.has("status") ? body.get("status").getAsString() : "Open";
                competitionDAO.updateStatus(compId, status);
                JsonObject res = new JsonObject();
                res.addProperty("message", "Status updated successfully.");
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write(gson.toJson(res));
            } else if ("publish".equalsIgnoreCase(action)) {
                competitionDAO.updateStatus(compId, "Published");
                JsonObject res = new JsonObject();
                res.addProperty("message", "Results published successfully!");
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write(gson.toJson(res));
            }
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        String pathInfo = req.getPathInfo();
        JsonObject body = readJsonBody(req);

        if (pathInfo != null) {
            String[] parts = pathInfo.split("/");
            if (parts.length == 2) {
                // Update competition
                String compId = parts[1];
                Competition c = competitionDAO.findById(compId);
                if (c == null) {
                    sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Competition not found.");
                    return;
                }
                c.setTitle(body.get("title").getAsString());
                c.setCategory(body.get("category").getAsString());
                c.setDescription(body.get("description").getAsString());
                c.setRules(body.get("rules").getAsString());
                c.setRegDeadline(Date.valueOf(body.get("regDeadline").getAsString()));
                c.setSubDeadline(Date.valueOf(body.get("subDeadline").getAsString()));

                competitionDAO.update(c);
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write(gson.toJson(c));
            } else if (parts.length == 3 && "judges".equalsIgnoreCase(parts[2])) {
                String compId = parts[1];
                Type listType = new TypeToken<List<String>>() {}.getType();
                List<String> judgeIds = gson.fromJson(body.get("judgeIds"), listType);
                competitionDAO.assignJudges(compId, judgeIds);

                JsonObject res = new JsonObject();
                res.addProperty("message", "Judges assigned successfully.");
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write(gson.toJson(res));
            }
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        String pathInfo = req.getPathInfo();
        if (pathInfo != null) {
            String[] parts = pathInfo.split("/");
            if (parts.length >= 2) {
                String compId = parts[1];
                competitionDAO.delete(compId);
                JsonObject res = new JsonObject();
                res.addProperty("message", "Competition and associated records deleted.");
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write(gson.toJson(res));
            }
        }
    }

    private JsonObject readJsonBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        JsonObject body = gson.fromJson(sb.toString(), JsonObject.class);
        return body != null ? body : new JsonObject();
    }

    private void sendError(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        JsonObject err = new JsonObject();
        err.addProperty("message", message);
        resp.getWriter().write(gson.toJson(err));
    }
}
