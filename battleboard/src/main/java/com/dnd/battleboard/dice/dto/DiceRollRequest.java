package com.dnd.battleboard.dice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DiceRollRequest {

    private String formula;

    private boolean privateRoll;
}
