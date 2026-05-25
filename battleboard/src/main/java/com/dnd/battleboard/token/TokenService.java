package com.dnd.battleboard.token;

import com.dnd.battleboard.session.Session;
import com.dnd.battleboard.session.SessionRepository;
import com.dnd.battleboard.token.dto.CreateTokenCommand;
import com.dnd.battleboard.token.dto.TokenResponse;
import com.dnd.battleboard.token.dto.UpdateTokenCommand;
import com.dnd.battleboard.user.User;
import com.dnd.battleboard.user.UserRepository;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Builder
public class TokenService {
    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final TokenMapper tokenMapper;
    private final SessionRepository sessionRepository;

    public TokenResponse createToken(CreateTokenCommand cmd, String username) {
        User tokenOwner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Token token = tokenMapper.toEntity(cmd, tokenOwner, null );
        token.setHp(token.getMaxHp());
        Token savedToken = tokenRepository.save(token);
        return tokenMapper.toResponse(savedToken);
    }

    public TokenResponse updateToken(UpdateTokenCommand cmd, UUID tokenId) {
        Session session = cmd.getSessionId() != null
                ? sessionRepository.findById(cmd.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found."))
                : null;
        Token token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("Token not found."));

        if (cmd.getName() != null) token.setName(cmd.getName());
        if (cmd.getSessionId() != null) token.setSession(session);
        if (cmd.getHp() != 0) token.setHp(cmd.getHp());
        if (cmd.getMaxHp() != 0) token.setMaxHp(cmd.getMaxHp());
        if (cmd.getAc() != 0) token.setAc(cmd.getAc());
        if (cmd.getStatuses() != null) token.setStatuses(cmd.getStatuses());

        tokenRepository.save(token);
        return tokenMapper.toResponse(token);
    }

    public void deleteToken(UUID tokenId){
        Token token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("Token not found"));
        token.setDeletedAt(LocalDateTime.now());
        token.setActive(false);
        tokenRepository.save(token);
    }

    public TokenResponse moveToken(UUID tokenId, int x, int y) {
        Token token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("Token not found"));
        token.setX(x);
        token.setY(y);
        tokenRepository.save(token);
        return tokenMapper.toResponse(token);
    }

    public List<TokenResponse> getAllByOwner(String username) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found."));
        return tokenRepository.findByOwnerAndDeletedAtIsNull(owner)
                .stream()
                .map(tokenMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<TokenResponse> getAllTokensBySession(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found."));
        return tokenRepository.findBySessionAndDeletedAtIsNull(session)
                .stream()
                .map(tokenMapper::toResponse)
                .collect(Collectors.toList());
    }
}
