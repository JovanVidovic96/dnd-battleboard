package com.dnd.battleboard.map;

import com.dnd.battleboard.map.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("api/maps")
@RequiredArgsConstructor
public class MapController {
    private final MapService mapService;
    private final MapMapper mapMapper;

    @PostMapping
    public ResponseEntity<MapResponse> createMap(@RequestBody CreateMapRequest req){
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        CreateMapCommand cmd = mapMapper.toCmd(req);
        return ResponseEntity.ok(mapService.createMap(cmd,username));
    }

    @PutMapping("{mapId}")
    public ResponseEntity<MapResponse> updateMap(@PathVariable UUID mapId,
                                                 @RequestBody UpdateMapRequest req){
        UpdateMapCommand cmd = mapMapper.toCmd(req);
        return ResponseEntity.ok(mapService.updateMap(mapId,cmd));
    }

    @DeleteMapping("{mapId}")
    public ResponseEntity<Void> deleteMap(@PathVariable UUID mapId){
        mapService.deleteMap(mapId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/owner")
    public ResponseEntity<List<MapResponse>> getMapsByOwner() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(mapService.getMapsByOwner(username));
    }
}
