package com.dnd.battleboard.session.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;


import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class SessionResponse {
    private UUID id;

    private String name;

    private String inviteCode;

    private String hostUsername;

    private int playerCount;

    private UUID activeMapId;

    private boolean isActive;
}
