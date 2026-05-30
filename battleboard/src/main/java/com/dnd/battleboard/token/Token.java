package com.dnd.battleboard.token;

import com.dnd.battleboard.common.BaseEntity;
import com.dnd.battleboard.session.Session;
import com.dnd.battleboard.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Data
@Builder
@Table(name = "tokens")
@NoArgsConstructor
@AllArgsConstructor
public class Token extends BaseEntity {

    @Id
    @Column(nullable = false, updatable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    private Session session;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    private User owner;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private int x;

    @Column(nullable = false)
    private int y;

    @Column(nullable = false)
    private int width;

    @Column(nullable = false)
    private int height;

    @Column(nullable = false)
    private int hp;

    @Column(nullable = false)
    private int maxHp;

    @Column(nullable = false)
    private int ac;

    @Column(nullable = false)
    private int initiative;

    @Column(nullable = false)
    private boolean isNpc;

    @Column(columnDefinition = "boolean default false")
    private boolean enemy;

    @Column(columnDefinition = "boolean default false")
    private boolean statsPublic;

    @ElementCollection(fetch = FetchType.LAZY)
    private List<String> statuses;

    private LocalDateTime deletedAt;

    @Builder.Default
    private boolean active = true;
}
