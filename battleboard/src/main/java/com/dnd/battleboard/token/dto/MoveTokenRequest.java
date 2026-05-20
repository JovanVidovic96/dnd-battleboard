package com.dnd.battleboard.token.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class MoveTokenRequest {
    private int x;
    private int y;
}
