package com.dnd.battleboard.dice;

import com.dnd.battleboard.common.BaseEntity;
import com.dnd.battleboard.session.Session;
import com.dnd.battleboard.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "dice_roll")
public class DiceRoll extends BaseEntity {
    @Id
    @Column(nullable = false, updatable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    private Session session;

    @ManyToOne
    private User diceUser;

    @Column
    private String formula;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<Integer> rolls;

    @Column
    private int rollsResult;

    private boolean privateRoll;

}
