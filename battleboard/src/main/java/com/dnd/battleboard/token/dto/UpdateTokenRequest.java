package com.dnd.battleboard.token.dto;


import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
public class UpdateTokenRequest {
    private String name;

    private UUID sessionId;

    private int hp;

    private int maxHp;

    private int ac;

    private List<String> statuses;

    private int initiative;
}
