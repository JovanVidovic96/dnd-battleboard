package com.dnd.battleboard.auth;

import com.dnd.battleboard.auth.dto.LoginCommand;
import com.dnd.battleboard.auth.dto.RegisterCommand;
import com.dnd.battleboard.user.User;
import com.dnd.battleboard.user.UserRepository;
import com.dnd.battleboard.auth.dto.AuthResponse;
import com.dnd.battleboard.auth.dto.RegisterRequest;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Builder
public class AuthService {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    public AuthResponse register (RegisterCommand command) {
        if(userRepository.existsByUsername(command.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if(userRepository.existsByEmail(command.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .username(command.getUsername())
                .email(command.getEmail())
                .password(bCryptPasswordEncoder.encode(command.getPassword()))
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser.getUsername());

        return AuthResponse.builder()
                .username(savedUser.getUsername())
                .token(token)
                .build();
    }

    public AuthResponse logIn (LoginCommand dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("No account registered with provided email"));

        if (!bCryptPasswordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Wrong password");
        }

        String token = jwtService.generateToken(user.getUsername());

        return AuthResponse.builder()
                .username(user.getUsername())
                .token(token)
                .build();
    }
}
