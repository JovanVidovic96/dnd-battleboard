package com.dnd.battleboard.map.dto;

import com.dnd.battleboard.map.Biome;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;



@AllArgsConstructor
@Data
@Builder
public class UpdateMapCommand {
    private String name;

    private Biome biome;

    private String backgroundImgUrl;

    private int cellSize;

    private int cellWidth;

    private int cellHeight;

    private String mapData;
}
