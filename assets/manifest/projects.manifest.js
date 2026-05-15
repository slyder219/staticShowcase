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
      summary: "Crappy terminal input/output puzzle game that prints a board, collects coordinate inputs for reflector placement (X and Y), and runs the board simulation (a lazer from a start point to a goal endpoint). There are flaws in this game. I have left them there. I would say I left them there for the sentiment. But the truth is I just don't care enough to fix them.",
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
      notes: "Interact with the terminal by entiering X, Y coordinates and reflactors as promopted. Type 0 and submit in order to run the game.",
    },
    {
      id: "hangman",
      title: "Hangman",
      summary: "Terminal word-guessing game with difficulty selection, repeated guesses, and ASCII hangman board updates. Traditionally used openai for word generation, but I don't feel like dealing with creating a little server just to hide the api key from you. So this uses a word bank.",
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
    {
      id: "gym-data-parsing",
      title: "GymDataParsing",
      summary: "Interactive terminal script that parses messy workout-note text into a pandas DataFrame, then runs a simple exercise query to preview results.",
      year: 2022,
      tags: ["cli", "terminal", "data", "pandas"],
      runtimeMode: "terminal-sim",
      status: "playable",
      entry: {
        projectRoot: "projects/GymDataParsing",
        scriptLocation: "projects/GymDataParsing/main.py",
        scriptPath: "projects/GymDataParsing/main.py",
        scriptType: "python",
        assetsPath: "projects/GymDataParsing",
      },
      terminal: {
        bootCommand: "python projects/GymDataParsing/main.py",
        allowedCommands: ["queued-input-run"],
        prompt: "gym-data> ",
      },
      notes: "Prompts for Enter-through steps, previews parsed data, and offers a 1/2/3 query choice in the same in-browser terminal flow.",
    },
  ],
};
