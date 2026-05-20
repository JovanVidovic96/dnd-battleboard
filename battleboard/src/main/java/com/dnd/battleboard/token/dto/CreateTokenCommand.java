package com.dnd.battleboard.token.dto;

import com.dnd.battleboard.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class CreateTokenCommand {

    private String name;

    private String imageUrl;

    private int width;

    private int height;

    private int maxHp;

    private int ac;

    private boolean isNpc;

}
