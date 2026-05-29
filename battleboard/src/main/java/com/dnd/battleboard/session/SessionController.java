package com.dnd.battleboard.session;

import com.dnd.battleboard.session.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("api/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final SessionService sessionService;
    private final SessionMapper sessionMapper;

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(@RequestBody CreateSessionRequest req) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        CreateSessionCommand cmd = sessionMapper.toCmd(req);
        return ResponseEntity.ok(sessionService.createSession(cmd, username));
    }

    @PostMapping("/join")
    public ResponseEntity<SessionResponse> joinSession(@RequestBody JoinSessionRequest req) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        JoinSessionCommand cmd = sessionMapper.toCmd(req);
        return ResponseEntity.ok(sessionService.joinSession(cmd.getInviteCode(), username));
    }
    @DeleteMapping("/{sessionId}/leave")
    public ResponseEntity<Void> leaveSession( @PathVariable UUID sessionId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        sessionService.leaveSession(sessionId,username);
        return ResponseEntity.ok().build();

    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> updateSession(@PathVariable UUID sessionId,
                                                         @RequestBody UpdateSessionRequest req) {
        UpdateSessionCommand cmd = sessionMapper.toCmd(req);
        return ResponseEntity.ok(sessionService.updateSession(sessionId,cmd));
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID sessionId){
        sessionService.deleteSession(sessionId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> getSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(sessionService.getSession(sessionId));
    }

    @GetMapping("/host")
    public ResponseEntity<List<SessionResponse>> getSessionByHost() {
        String hostUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(sessionService.getSessionsByHost(hostUsername));
    }

    @GetMapping("/host/active")
    public ResponseEntity<List<SessionResponse>> getActiveSessionByHost() {
        String hostUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(sessionService.getActiveSessionByHost(hostUsername));
    }
}
