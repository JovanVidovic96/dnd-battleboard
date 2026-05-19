package com.dnd.battleboard.session;


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
        session.setName(cmd.getName());
        session.setActive(cmd.isActive());
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

        return sessionRepository.findByHost(host)
                .stream()
                .map(sessionMapper::toResponse)
                .collect(Collectors.toList());
    }

    public SessionResponse getActiveSessionByHost (String username) {
        User host = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Host not found"));

        return sessionRepository.findByHostAndActive(host, true)
                .map(sessionMapper::toResponse)
                .orElseThrow(() -> new RuntimeException("No active sessions found"));
    }
}
