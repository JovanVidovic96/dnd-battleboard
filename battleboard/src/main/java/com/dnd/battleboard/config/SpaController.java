package com.dnd.battleboard.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping(value = {"/login", "/lobby", "/game/**", "/map-editor/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
