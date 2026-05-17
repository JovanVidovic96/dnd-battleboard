package com.dnd.battleboard.auth;

import com.dnd.battleboard.auth.dto.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;


@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthMapper authMapper;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register (@RequestBody RegisterRequest dto){
        RegisterCommand cmd = authMapper.toCmd(dto);
        return ResponseEntity.ok(authService.register(cmd));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login (@RequestBody LoginRequest dto) {
        LoginCommand cmd = authMapper.toCmd(dto);
        return ResponseEntity.ok(authService.logIn(cmd));
    }
}
