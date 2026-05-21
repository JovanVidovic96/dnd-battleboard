package com.dnd.battleboard.websocket.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
public class TokenMoveMessage {

    private UUID tokenId;

    private UUID sessionId;

    private int x;

    private int y;
}
