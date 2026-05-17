package com.dnd.battleboard.user;

import com.dnd.battleboard.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;


@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@Table(name="users")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;


}
