package com.dnd.battleboard.dice;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class DiceParseResult {
    private List<Integer> rolls;
    private int total;

}
