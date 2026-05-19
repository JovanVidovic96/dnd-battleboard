package com.dnd.battleboard.map.dto;

import com.dnd.battleboard.map.Biome;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class UpdateMapRequest {
    private String name;

    private Biome biome;

    private String backgroundImgUrl;

    private int cellSize;

    private int cellWidth;

    private int cellHeight;
}
