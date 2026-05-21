package com.dnd.battleboard.dice;

import com.dnd.battleboard.session.Session;
import com.dnd.battleboard.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;


public interface DiceRollRepository extends JpaRepository<DiceRoll, UUID> {
    List<DiceRoll> findBySession(Session session);
    List<DiceRoll> findBySessionAndPrivateRollFalse(Session session);
    List<DiceRoll> findBySessionAndDiceUser(Session session, User user);
}
