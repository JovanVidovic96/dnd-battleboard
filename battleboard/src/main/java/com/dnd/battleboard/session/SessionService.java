package com.dnd.battleboard.session;

import com.dnd.battleboard.map.Map;
import com.dnd.battleboard.map.MapRepository;
import com.dnd.battleboard.session.dto.CreateSessionCommand;
import com.dnd.battleboard.session.dto.SessionResponse;
import com.dnd.battleboard.session.dto.UpdateSessionCommand;
import com.dnd.battleboard.user.User;
import com.dnd.battleboard.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class SessionService {
    private final UserRepository userRepository;
    private final SessionMapper sessionMapper;
    private final SessionRepository sessionRepository;
    private final MapRepository mapRepository;

    private String generateInviteCode () {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
    public SessionResponse createSession(CreateSessionCommand dto, String username) {
        User host = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String inviteCode = generateInviteCode();
        Session session = sessionMapper.toEntity(dto, host, inviteCode);
        Session savedSession = sessionRepository.save(session);
        return sessionMapper.toResponse(savedSession);
    }

    public SessionResponse joinSession(String inviteCode, String username){
        Session activeSession = sessionRepository.findByInviteCode(inviteCode)
                .orElseThrow(() ->new RuntimeException("Session not found."));

        User player = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Player not found."));

        if (!Boolean.TRUE.equals(activeSession.getActive())) {
            throw new RuntimeException("Session is not active");
        }

        if (activeSession.getPlayers().contains(player)) {
            throw new RuntimeException("Player already in session");
        }

        activeSession.getPlayers().add(player);

        Session savedSession = sessionRepository.save(activeSession);

        return sessionMapper.toResponse(savedSession);
    }

    public void leaveSession(UUID sessionId, String username) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        User player = userRepository.findByUsername(username)
                        .orElseThrow(() -> new RuntimeException("Player not found"));
        session.getPlayers().remove(player);
        sessionRepository.save(session);
    }

    public SessionResponse updateSession(UUID sessionId, UpdateSessionCommand cmd) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found."));

        if (cmd.getName() != null) session.setName(cmd.getName());
        if (cmd.getActiveMapId() != null) {
            Map map = mapRepository.findById(cmd.getActiveMapId())
                    .orElseThrow(() -> new RuntimeException("Map not found."));
            session.setActiveMap(map);
        }
        if (cmd.getIsActive() != null) session.setActive(cmd.getIsActive());
        sessionRepository.save(session);
        return sessionMapper.toResponse(session);
    }

    public void deleteSession(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setDeletedAt(LocalDateTime.now());
        session.setActive(false);
        sessionRepository.save(session);
    }

    public List<SessionResponse> getSessionsByHost(String username) {
        User host = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Host not found"));

        return sessionRepository.findByHostAndDeletedAtIsNull(host)
                .stream()
                .map(sessionMapper::toResponse)
                .collect(Collectors.toList());
    }

    public SessionResponse getSession(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found."));
        return sessionMapper.toResponse(session);
    }

    public List<SessionResponse> getActiveSessionByHost (String username) {
        User host = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Host not found"));

        return sessionRepository.findByHostAndActive(host, true)
                .stream()
                .map(sessionMapper::toResponse)
                .collect(Collectors.toList());
    }
}
