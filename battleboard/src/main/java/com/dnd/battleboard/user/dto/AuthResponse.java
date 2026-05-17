package com.dnd.battleboard.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String username;
}
