package com.dnd.battleboard.token.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class TokenResponse {

    private UUID id;

    private UUID sessionId;

    private String name;

    private String ownerUsername;

    private String imageUrl;

    private int x;

    private int y;

    private int width;

    private int height;

    private int hp;

    private int maxHp;

    private int ac;

    private int initiative;

    private boolean isNpc;

    private boolean enemy;

    private List<String> statuses;

    private boolean active;
}
