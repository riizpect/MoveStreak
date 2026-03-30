# MoveStreak 2.0 QA Checklist

## Core
- Log one activity day from home screen.
- Verify long-press does not log again after day is already logged.
- Verify current streak increments exactly once.
- Verify best streak updates when current streak exceeds it.

## Retroactive + History
- Set a retroactive start date and verify streak count.
- Open history modal and verify 7/30 insights and trend render.
- Add a historical streak manually and verify list item/date rendering.
- Remove a historical streak and verify best streak recalculates.

## Milestones
- Validate milestone modal appears on 7/30/100/365 streak counts.
- Verify milestone modal dismiss action works.
- Verify share text includes milestone sentence on milestone days.

## Notifications
- Toggle notifications on/off.
- Change reminder time and verify state persists after app restart.

## Settings + Localization
- Verify settings section headers appear and remain readable in dark mode.
- Toggle dark mode and background options.
- Toggle Swedish/English and verify new strings render.

## Data persistence
- Restart app and verify streak, history, and activity insights persist.
