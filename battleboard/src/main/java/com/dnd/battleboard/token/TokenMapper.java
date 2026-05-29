package com.dnd.battleboard.token;


import com.dnd.battleboard.session.Session;
import com.dnd.battleboard.token.dto.*;
import com.dnd.battleboard.user.User;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TokenMapper {

    public CreateTokenCommand toCmd (CreateTokenRequest req) {
        return CreateTokenCommand.builder()
                .name(req.getName())
                .imageUrl(req.getImageUrl())
                .width(req.getWidth())
                .height(req.getHeight())
                .maxHp(req.getMaxHp())
                .ac(req.getAc())
                .isNpc(req.isNpc())
                .build();
    }

    public UpdateTokenCommand toCmd(UpdateTokenRequest req, UUID sessionId) {
        return UpdateTokenCommand.builder()
                .sessionId(sessionId)
                .name(req.getName())
                .hp(req.getHp())
                .maxHp(req.getMaxHp())
                .ac(req.getAc())
                .statuses(req.getStatuses())
                .initiative(req.getInitiative())
                .build();
    }

    public Token toEntity (CreateTokenCommand dto, User owner, Session session) {
        return Token.builder()
                .owner(owner)
                .session(session)
                .name(dto.getName())
                .imageUrl(dto.getImageUrl())
                .width(dto.getWidth())
                .height(dto.getHeight())
                .maxHp(dto.getMaxHp())
                .ac(dto.getAc())
                .isNpc(dto.isNpc())
                .build();
    }

    public TokenResponse toResponse(Token token) {
        return TokenResponse.builder()
                .id(token.getId())
                .sessionId(token.getSession() != null ? token.getSession().getId() : null)
                .name(token.getName())
                .ownerUsername(token.getOwner().getUsername())
                .imageUrl(token.getImageUrl())
                .x(token.getX())
                .y(token.getY())
                .width(token.getWidth())
                .height(token.getHeight())
                .hp(token.getHp())
                .maxHp(token.getMaxHp())
                .ac(token.getAc())
                .initiative(token.getInitiative())
                .isNpc(token.isNpc())
                .statuses(token.getStatuses())
                .active(token.isActive())
                .build();
    }

}
