package com.dnd.battleboard.session;

import com.dnd.battleboard.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface SessionRepository extends JpaRepository<Session, UUID> {
    Optional<Session> findByInviteCode(String inviteCode);
    Optional<Session> findByHost(User host);
    List<Session> findByIsActive(boolean isActive);
}
