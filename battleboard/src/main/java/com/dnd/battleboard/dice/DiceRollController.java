package com.dnd.battleboard.dice;

import com.dnd.battleboard.dice.dto.DiceRollRequest;
import com.dnd.battleboard.dice.dto.DiceRollResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/dice")
public class DiceRollController {

    private final DiceRollMapper diceRollMapper;
    private final DiceRollService diceRollService;

    @PostMapping("{sessionId}")
    public ResponseEntity<DiceRollResponse> rollDice(@PathVariable UUID sessionId, @RequestBody DiceRollRequest req){
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(diceRollService.rollDice(req, username, sessionId));
    }

    @GetMapping("{sessionId}/history")
    public ResponseEntity<List<DiceRollResponse>> getSessionHistory(@PathVariable UUID sessionId){
        return ResponseEntity.ok(diceRollService.getSessionHistory(sessionId));
    }

    @GetMapping("{sessionId}/public")
    public ResponseEntity<List<DiceRollResponse>> getPublicSessionHistory(@PathVariable UUID sessionId){
        return ResponseEntity.ok(diceRollService.getPublicSessionHistory(sessionId));
    }

    @GetMapping("{sessionId}/player")
    public ResponseEntity<List<DiceRollResponse>> getPlayerHistory(@PathVariable UUID sessionId){
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok((diceRollService.getPlayerHistory(sessionId, username)));
    }
}
