package com.dnd.battleboard.token;

import com.dnd.battleboard.session.Session;
import com.dnd.battleboard.session.SessionRepository;
import com.dnd.battleboard.token.dto.CreateTokenCommand;
import com.dnd.battleboard.token.dto.TokenResponse;
import com.dnd.battleboard.token.dto.UpdateTokenCommand;
import com.dnd.battleboard.user.User;
import com.dnd.battleboard.user.UserRepository;
import lombok.Builder;
import lombok.NoArgsConstructor;
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
        Token savedToken = tokenRepository.save(token);
        return tokenMapper.toResponse(savedToken);
    }

    public TokenResponse updateToken(UpdateTokenCommand cmd, UUID tokenId) {
        Session session = cmd.getSessionId() !=null ? sessionRepository.findById(cmd.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found.")) : null;
        Token token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("Token not found."));
        token.setName(cmd.getName());
        token.setSession(session);
        token.setHp(cmd.getHp());
        token.setMaxHp(cmd.getMaxHp());
        token.setAc(cmd.getAc());
        token.setStatuses(cmd.getStatuses());
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
        return tokenRepository.findByOwner(owner)
                .stream()
                .map(tokenMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<TokenResponse> getAllTokensBySession(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found."));
        return  tokenRepository.findBySession(session)
                .stream()
                .map(tokenMapper::toResponse)
                .collect(Collectors.toList());
    }
}
