package com.dnd.battleboard.token.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class UpdateTokenCommand {
    private String name;

    private UUID sessionId;

    private int hp;

    private int maxHp;

    private int ac;

    private List<String> statuses;

    private int initiative;
}
