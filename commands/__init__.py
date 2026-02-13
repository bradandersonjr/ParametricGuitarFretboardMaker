# Commands package for Parametric Guitar: Fretboard Maker
# Each command module provides start() and stop() functions.

from .guitarMaker import entry as guitarMaker

# List of all command modules. Fusion calls start() and stop() on each.
commands = [
    guitarMaker,
]


def start(is_startup=False):
    for command in commands:
        command.start(is_startup=is_startup)


def stop():
    for command in commands:
        command.stop()
