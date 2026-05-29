package com.dnd.battleboard.session.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSessionRequest {
    private String name;
    private UUID activeMapId;
    private boolean isActive;
}
