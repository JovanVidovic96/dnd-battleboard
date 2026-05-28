package com.dnd.battleboard.map;

import com.dnd.battleboard.map.dto.*;
import com.dnd.battleboard.user.User;
import org.springframework.stereotype.Component;

@Component
public class MapMapper {

    public CreateMapCommand toCmd (CreateMapRequest req) {
        return new CreateMapCommand(
                req.getName(),
                req.getBiome(),
                req.getBackgroundImgUrl(),
                req.getCellSize(),
                req.getCellWidth(),
                req.getCellHeight()
        );
    }

    public UpdateMapCommand toCmd (UpdateMapRequest req) {
        return new UpdateMapCommand(
                req.getName(),
                req.getBiome(),
                req.getBackgroundImgUrl(),
                req.getCellSize(),
                req.getCellWidth(),
                req.getCellHeight(),
                req.getMapData()
        );
    }

    public Map toEntity (CreateMapCommand dto, User mapOwner) {
        return Map.builder()
                .mapOwner(mapOwner)
                .name(dto.getName())
                .biome(dto.getBiome())
                .backgroundImgUrl(dto.getBackgroundImgUrl())
                .cellSize(dto.getCellSize())
                .cellWidth(dto.getCellWidth())
                .cellHeight(dto.getCellHeight())
                .build();

    }
    public MapResponse toResponse(Map map) {
        return new MapResponse(
                map.getId(),
                map.getMapOwner().getUsername(),
                map.getName(),
                map.getBiome(),
                map.getBackgroundImgUrl(),
                map.getCellSize(),
                map.getCellWidth(),
                map.getCellHeight(),
                map.isActive(),
                map.getMapData()
        );
    }
}
