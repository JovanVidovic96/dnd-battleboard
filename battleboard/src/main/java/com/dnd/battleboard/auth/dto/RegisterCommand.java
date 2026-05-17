package com.dnd.battleboard.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * $
 *
 * @param $
 * @return $
 * @throws $
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegisterCommand {
    private String username;
    private String email;
    private String password;
}

