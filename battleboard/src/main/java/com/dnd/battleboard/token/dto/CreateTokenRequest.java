package com.dnd.battleboard.token.dto;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
public class CreateTokenRequest {
    private String name;

    private String imageUrl;

    private int width;

    private int height;

    private int maxHp;

    private int ac;

    @JsonProperty("isNpc")
    private boolean isNpc;

    private boolean enemy;
}
