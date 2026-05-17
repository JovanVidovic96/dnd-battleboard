package com.dnd.battleboard.session.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * $
 *
 * @param $
 * @return $
 * @throws $
 */
@Data
@NoArgsConstructor

public class UpdateSessionCommand {
    private String name;
    private boolean isActive;
}
