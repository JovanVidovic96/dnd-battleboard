package com.dnd.battleboard.map.dto;

import com.dnd.battleboard.map.Biome;
import com.dnd.battleboard.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class MapResponse {

    private UUID id;


    private String ownerUsername;

    private String name;

    private Biome biome;

    private String backgroundImgUrl;

    private int cellSize;

    private int cellWidth;

    private int cellHeight;

    private boolean active;
}
