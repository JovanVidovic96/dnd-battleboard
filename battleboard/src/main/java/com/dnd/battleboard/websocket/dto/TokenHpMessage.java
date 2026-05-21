package com.dnd.battleboard.websocket.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;


@Data
@NoArgsConstructor
public class TokenHpMessage {

    private UUID tokenId;

    private int hp;

    private UUID sessionId;
}
