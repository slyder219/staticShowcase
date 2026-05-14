// Auto-generated from projects.manifest.json
// Edit this file when adding or updating projects.
// Importing as a JS module avoids fetch() so the site works on file:// and HTTP alike.

export const manifest = {
  manifestVersion: "0.1.0",
  generatedAt: "2026-05-14T16:40:00Z",
  basePath: ".",
  projects: [
    {
      id: "snake-game",
      title: "SnakeGame",
      summary: "Terminal input/output puzzle game that prints a board, collects coordinate inputs, and runs the board simulation.",
      year: 2022,
      tags: ["cli", "terminal", "game"],
      runtimeMode: "terminal-sim",
      status: "playable",
      entry: {
        projectRoot: "projects/SnakeGame",
        scriptLocation: "projects/SnakeGame/main.py",
        scriptPath: "projects/SnakeGame/main.py",
        scriptType: "python",
        assetsPath: "projects/SnakeGame",
      },
      terminal: {
        bootCommand: "python projects/SnakeGame/main.py",
        allowedCommands: ["queued-input-run"],
        prompt: "snake-game> ",
      },
      notes: "Queue each input value in order (x, y, slash type, repeat), then run the script in-browser.",
    },
    {
      id: "hangman",
      title: "Hangman",
      summary: "Terminal word-guessing game with difficulty selection, repeated guesses, and ASCII hangman board updates.",
      year: 2022,
      tags: ["cli", "terminal", "game", "word"],
      runtimeMode: "terminal-sim",
      status: "playable",
      entry: {
        projectRoot: "projects/Hangman",
        scriptLocation: "projects/Hangman/main.py",
        scriptPath: "projects/Hangman/main.py",
        scriptType: "python",
        assetsPath: "projects/Hangman",
      },
      terminal: {
        bootCommand: "python projects/Hangman/main.py",
        allowedCommands: ["queued-input-run"],
        prompt: "hangman> ",
      },
      notes: "Runs in the same in-browser terminal flow as SnakeGame. If no OpenAI key is present, the script falls back to its local word bank.",
    },
  ],
};
