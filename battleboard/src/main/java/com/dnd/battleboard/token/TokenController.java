package com.dnd.battleboard.token;

import com.dnd.battleboard.token.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("api/tokens")
@RequiredArgsConstructor
public class TokenController {
    private final TokenMapper tokenMapper;
    private final TokenService tokenService;


    @PostMapping
    public ResponseEntity<TokenResponse> createToken(@RequestBody CreateTokenRequest req){
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        CreateTokenCommand cmd = tokenMapper.toCmd(req);
        return ResponseEntity.ok(tokenService.createToken(cmd,username));
    }

    @PutMapping("/{tokenId}")
    public ResponseEntity<TokenResponse> updateToken(@RequestBody UpdateTokenRequest req,
                                                     @PathVariable UUID tokenId) {
        UpdateTokenCommand cmd = tokenMapper.toCmd(req, req.getSessionId());
        return ResponseEntity.ok(tokenService.updateToken(cmd, tokenId));
    }

    @DeleteMapping("/{tokenId}/session")
    public ResponseEntity<Void> removeToken(@PathVariable UUID tokenId){
        tokenService.removeFromSession(tokenId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{tokenId}")
    public ResponseEntity<Void> deleteToken(@PathVariable UUID tokenId) {
        tokenService.deleteToken(tokenId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{tokenId}/move")
    public ResponseEntity<TokenResponse> moveToken(@PathVariable UUID tokenId,
                                                   @RequestBody MoveTokenRequest req) {
        return ResponseEntity.ok(tokenService.moveToken(tokenId,req.getX(), req.getY()));
    }

    @GetMapping("/owner")
    public ResponseEntity<List<TokenResponse>> getAllByOwner(){
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(tokenService.getAllByOwner(username));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<TokenResponse>> getAllTokensBySession(@PathVariable UUID sessionId){
        return ResponseEntity.ok(tokenService.getAllTokensBySession(sessionId));
    }
}
