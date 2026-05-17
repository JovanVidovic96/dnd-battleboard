package com.dnd.battleboard.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
@AllArgsConstructor
@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String email;

}
