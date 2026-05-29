package com.dnd.battleboard.websocket.dto;


import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;
@Data
@NoArgsConstructor
public class FogMessage {
    private UUID sessionId;
    private List<String> revealedCells;
}
