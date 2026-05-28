package com.dnd.battleboard.map;


import com.dnd.battleboard.common.BaseEntity;
import com.dnd.battleboard.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
@Builder
@EqualsAndHashCode(callSuper = true)
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "game_map")
public class Map extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne
    private User mapOwner;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Biome biome;

    @Column(nullable = false)
    private String backgroundImgUrl;

    @Column(nullable = false)
    private int cellSize;

    @Column(nullable = false)
    private int cellWidth;

    @Column(nullable = false)
    private int cellHeight;

    @Column(columnDefinition = "TEXT")
    private String mapData;

    @Builder.Default
    private boolean active = true;

    private LocalDateTime deletedAt = null;


}
