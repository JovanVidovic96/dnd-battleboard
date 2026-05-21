package com.dnd.battleboard.dice.dto;

import com.dnd.battleboard.dice.DiceRoll;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class DiceRollResponse {

    private UUID id;

    private String formula;

    private List<Integer> rolls;

    private int rollsResult;

    private boolean privateRoll;

    private String ownerUsername;

    private UUID sessionId;

    private LocalDateTime createdAt;
}
