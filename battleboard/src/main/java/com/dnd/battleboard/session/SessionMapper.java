package com.dnd.battleboard.session;

import com.dnd.battleboard.session.dto.*;
import com.dnd.battleboard.user.User;
import org.springframework.stereotype.Component;

import java.util.ArrayList;


@Component
public class SessionMapper {

    public CreateSessionCommand toCmd (CreateSessionRequest dto) {
        return new CreateSessionCommand(
                dto.getName()
        );
    }

    public JoinSessionCommand toCmd (JoinSessionRequest dto) {
        return new JoinSessionCommand(
                dto.getInviteCode()
        );
    }

    public UpdateSessionCommand toCmd (UpdateSessionRequest dto) {
        return new UpdateSessionCommand(
                dto.getName(),
                dto.isActive()
        );
    }

    public Session toEntity(CreateSessionCommand dto, User host, String inviteCode){
        return Session.builder()
                .name(dto.getName())
                .host(host)
                .inviteCode(inviteCode)
                .players(new ArrayList<>())
                .build();
    }

    public SessionResponse toResponse (Session session) {
        return new SessionResponse(
                session.getId(),
                session.getName(),
                session.getInviteCode(),
                session.getHost().getUsername(),
                session.getPlayers().size(),
                session.isActive()
        );
    }
}
