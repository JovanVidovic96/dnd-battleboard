package com.dnd.battleboard.session.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSessionCommand {
    private String name;
    private UUID activeMapId;
    private Boolean isActive;
}
