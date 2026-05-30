package com.dnd.battleboard.websocket.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class StatsVisibilityMessage {
    private String tokenId;
    private String sessionId;
    private boolean statsPublic;
}
