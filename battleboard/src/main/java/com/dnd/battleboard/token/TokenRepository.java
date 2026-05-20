package com.dnd.battleboard.token;

import com.dnd.battleboard.session.Session;
import com.dnd.battleboard.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;


public interface TokenRepository extends JpaRepository<Token, UUID> {
    List<Token> findBySession(Session session);
    List<Token> findByOwner (User owner);
    List<Token> findBySessionAndIsNpc (Session session, boolean isNpc);
}
