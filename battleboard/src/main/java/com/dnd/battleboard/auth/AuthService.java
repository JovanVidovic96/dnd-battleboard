package com.dnd.battleboard.auth;

import ch.qos.logback.core.subst.Token;
import com.dnd.battleboard.user.User;
import com.dnd.battleboard.user.UserRepository;
import com.dnd.battleboard.user.dto.AuthResponse;
import com.dnd.battleboard.user.dto.RegisterRequest;
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

    public AuthResponse register (RegisterRequest request) {
        if(userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if(userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(bCryptPasswordEncoder.encode(request.getPassword()))
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser.getUsername());

        return AuthResponse.builder()
                .username(savedUser.getUsername())
                .token(token)
                .build();
    }

    public AuthResponse logIn (String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account registered with provided email"));

        if (!bCryptPasswordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Wrong password");
        }

        String token = jwtService.generateToken(user.getUsername());

        return AuthResponse.builder()
                .username(user.getUsername())
                .token(token)
                .build();
    }
}
