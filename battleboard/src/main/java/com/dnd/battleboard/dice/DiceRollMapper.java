package com.dnd.battleboard.dice;

import com.dnd.battleboard.dice.dto.DiceRollRequest;
import com.dnd.battleboard.dice.dto.DiceRollResponse;
import com.dnd.battleboard.session.Session;
import com.dnd.battleboard.user.User;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DiceRollMapper {

    public DiceRoll toEntity(DiceRollRequest req, User user, Session session, List<Integer> rolls, int result) {
        return DiceRoll.builder()
                .session(session)
                .diceUser(user)
                .rollsResult(result)
                .rolls(rolls)
                .formula(req.getFormula())
                .privateRoll(req.isPrivateRoll())
                .build();
    }

    public DiceRollResponse toResponse(DiceRoll diceRoll) {
        return DiceRollResponse.builder()
                .id(diceRoll.getId())
                .formula(diceRoll.getFormula())
                .rolls(diceRoll.getRolls())
                .rollsResult(diceRoll.getRollsResult())
                .privateRoll(diceRoll.isPrivateRoll())
                .ownerUsername(diceRoll.getDiceUser().getUsername())
                .sessionId(diceRoll.getSession().getId())
                .createdAt(diceRoll.getCreatedAt())
                .build();
    }
}
