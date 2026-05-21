package com.dnd.battleboard.dice;

import com.dnd.battleboard.dice.dto.DiceRollRequest;
import com.dnd.battleboard.dice.dto.DiceRollResponse;
import com.dnd.battleboard.session.Session;
import com.dnd.battleboard.session.SessionRepository;
import com.dnd.battleboard.user.User;
import com.dnd.battleboard.user.UserRepository;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class DiceRollService {
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final DiceRollRepository diceRollRepository;
    private final DiceRollMapper diceRollMapper;

    public DiceRollResponse rollDice(DiceRollRequest req, String username, UUID sessionId){
        User diceUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found."));
        DiceParser diceParser = new DiceParser();
        DiceParseResult result = diceParser.parse(req.getFormula());

        DiceRoll diceRoll = diceRollMapper.toEntity(req,diceUser,session,result.getRolls(),result.getTotal());
        DiceRoll savedRoll = diceRollRepository.save(diceRoll);
        return diceRollMapper.toResponse(savedRoll);
    }

    public List<DiceRollResponse> getSessionHistory(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found."));

        return diceRollRepository.findBySession(session)
                .stream()
                .map(diceRollMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<DiceRollResponse> getPublicSessionHistory(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        return diceRollRepository.findBySessionAndPrivateRollFalse(session)
                .stream()
                .map(diceRollMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<DiceRollResponse> getPlayerHistory(UUID sessionId, String username) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found."));
        User diceUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return diceRollRepository.findBySessionAndDiceUser(session,diceUser)
                .stream()
                .map(diceRollMapper::toResponse)
                .collect(Collectors.toList());
    }

}
