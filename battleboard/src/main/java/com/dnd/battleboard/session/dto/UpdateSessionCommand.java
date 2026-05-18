package com.dnd.battleboard.session.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSessionCommand {
    private String name;
    private boolean isActive;
}
