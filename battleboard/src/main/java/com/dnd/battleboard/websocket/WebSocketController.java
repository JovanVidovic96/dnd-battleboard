package com.dnd.battleboard.websocket;

import com.dnd.battleboard.token.TokenService;
import com.dnd.battleboard.websocket.dto.FogMessage;
import com.dnd.battleboard.websocket.dto.TokenHpMessage;
import com.dnd.battleboard.websocket.dto.TokenMoveMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final TokenService tokenService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/token/move")
    public void moveToken(TokenMoveMessage message) {
        tokenService.moveToken(message.getTokenId(), message.getX(), message.getY());
        messagingTemplate.convertAndSend(
                "/topic/session/" + message.getSessionId(),
                message
        );
    }

    @MessageMapping("/token/hp")
    public void updateHp(TokenHpMessage message) {
        messagingTemplate.convertAndSend(
                "/topic/session/" + message.getSessionId(),
                message
        );
    }

    @MessageMapping("/fog")
    public void fogOfWar(FogMessage fogMessage) {
        messagingTemplate.convertAndSend(
                "/topic/session/" + fogMessage.getSessionId(), fogMessage
        );
    }
}