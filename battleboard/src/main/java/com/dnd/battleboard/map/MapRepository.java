package com.dnd.battleboard.map;

import com.dnd.battleboard.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MapRepository extends JpaRepository<Map, UUID> {
    List<Map> findByMapOwner(User mapOwner);
}
