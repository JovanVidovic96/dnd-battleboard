package com.dnd.battleboard.map;

import com.dnd.battleboard.map.dto.CreateMapCommand;
import com.dnd.battleboard.map.dto.MapResponse;
import com.dnd.battleboard.map.dto.UpdateMapCommand;
import com.dnd.battleboard.user.User;
import com.dnd.battleboard.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MapService {
    private final MapMapper mapMapper;
    private final MapRepository mapRepository;
    private final UserRepository userRepository;


    public MapResponse createMap(CreateMapCommand dto, String username) {
        User mapOwner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found."));

        Map map = mapMapper.toEntity(dto, mapOwner);
        Map mapToSave = mapRepository.save(map);
        return mapMapper.toResponse(mapToSave);
    }

    public MapResponse getMap(UUID mapId) {
        Map map = mapRepository.findById(mapId)
                .orElseThrow(() -> new RuntimeException("Map not found"));
        return mapMapper.toResponse(map);
    }


    public MapResponse updateMap(UUID mapId, UpdateMapCommand dto) {
        Map map = mapRepository.findById(mapId)
                .orElseThrow(() -> new RuntimeException("Map not found."));
        map.setName(dto.getName());
        map.setBiome(dto.getBiome());
        map.setBackgroundImgUrl(dto.getBackgroundImgUrl());
        map.setCellSize(dto.getCellSize());
        map.setCellWidth(dto.getCellWidth());
        map.setCellHeight(dto.getCellHeight());
        if (dto.getMapData() != null) map.setMapData(dto.getMapData());

        mapRepository.save(map);
        return mapMapper.toResponse(map);
    }

    public void deleteMap (UUID mapId) {
        Map map = mapRepository.findById(mapId)
                .orElseThrow(() -> new RuntimeException("Map not found."));
        map.setDeletedAt(LocalDateTime.now());
        map.setActive(false);
        mapRepository.save(map);
    }

    public List<MapResponse> getMapsByOwner (String username) {
        User mapOwner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found."));
        return mapRepository.findByMapOwner(mapOwner)
                .stream()
                .map(mapMapper::toResponse)
                .collect(Collectors.toList());
    }
}
