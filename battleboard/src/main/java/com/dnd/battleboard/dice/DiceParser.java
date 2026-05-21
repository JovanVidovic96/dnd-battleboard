package com.dnd.battleboard.dice;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

public class DiceParser {

    private static final Random random = new Random();

    public DiceParseResult parse(String formula) {

        List<Integer> allRolls = new ArrayList<>();
        int total = 0;

        String[] parts = formula.split("\\+");

        for (String part : parts) {
            part = part.trim().toLowerCase();

            if (part.contains("kh") || part.contains("kl")) {
                DiceParseResult keepResult = parseKeep(part);
                allRolls.addAll(keepResult.getRolls());
                total += keepResult.getTotal();
            } else if (part.contains("d")) {
                String[] diceParts = part.split("d");
                int count = Integer.parseInt(diceParts[0]);
                int sides = Integer.parseInt(diceParts[1]);

                for (int i = 0; i < count; i++) {
                    int roll = random.nextInt(sides) + 1;
                    allRolls.add(roll);
                    total += roll;
                }
            }
        }

        return new DiceParseResult(allRolls, total);
    }

    private DiceParseResult parseKeep(String part) {
        List<Integer> rolls = new ArrayList<>();

        boolean keepHigh = part.contains("kh");
        String[] split = part.split(keepHigh ? "kh" : "kl");
        String[] diceParts = split[0].split("d");

        int count = Integer.parseInt(diceParts[0]);
        int sides = Integer.parseInt(diceParts[1]);
        int keep = Integer.parseInt(split[1]);

        for (int i = 0; i < count; i++) {
            rolls.add(random.nextInt(sides) + 1);
        }

        List<Integer> sorted = new ArrayList<>(rolls);
        if (keepHigh) {
            sorted.sort(Collections.reverseOrder());
        } else {
            Collections.sort(sorted);
        }

        int total = sorted.subList(0, keep)
                .stream()
                .mapToInt(Integer::intValue)
                .sum();

        return new DiceParseResult(rolls, total);
    }
}