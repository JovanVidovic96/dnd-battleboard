package com.dnd.battleboard.session.dto;


import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor

public class CreateSessionRequest {
    private String name;
}
