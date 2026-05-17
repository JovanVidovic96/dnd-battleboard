package com.dnd.battleboard.auth;

import com.dnd.battleboard.auth.dto.LoginCommand;
import com.dnd.battleboard.auth.dto.LoginRequest;
import com.dnd.battleboard.auth.dto.RegisterCommand;
import com.dnd.battleboard.auth.dto.RegisterRequest;
import com.dnd.battleboard.user.User;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public RegisterCommand toCmd (RegisterRequest dto) {
        return new RegisterCommand(
                dto.getUsername(),
                dto.getEmail(),
                dto.getPassword()
        );
    }

    public LoginCommand toCmd (LoginRequest dto) {
        return new LoginCommand(
                dto.getEmail(),
                dto.getPassword()
        );
    }

    public User toEntity(RegisterCommand dto) {
        return User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .password(dto.getPassword())
                .build();
    }
}
