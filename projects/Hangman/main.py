# import openai
import random
import os 
    
class gameplay():
    WORD_BANK = [
        "an", "as", "at", "be", "do", "go", "he", "if", "in", "it", "me", "no", "of", "on", "up", "we",
        "cat", "dog", "sun", "map", "bug", "pen", "red", "top", "arm", "ice", "oak", "owl",
        "bird", "door", "fish", "game", "lamp", "moon", "tree", "wind", "book", "code",
        "apple", "brave", "chalk", "dream", "earth", "flame", "grape", "house", "light", "smile",
        "banana", "castle", "friend", "garden", "hunter", "island", "jungle", "kitten", "rocket", "window",
        "animal", "bright", "danger", "forest", "guitar", "horizon", "lantern", "mountain", "puzzle", "rainbow",
        "fossil", "gentle", "history", "moment", "picture", "summer", "whisper",
        "against", "balance", "capture", "diamond", "emerald", "freedom", "journey", "monster", "sparkle",
        "airplane", "birthday", "classroom", "elephant", "goodbye", "holiday", "midnight", "notebook", "treasure", "umbrella",
        "adventure", "background", "chocolate", "dinosaur", "galaxy", "landscape", "password", "sandwich", "together", "unknown",
        "butterfly", "cylinder", "dictionary", "framework", "helicopter", "javascript", "landmark", "processor", "telephone", "volunteer",
        "blackboard", "celebrate", "daydreamer", "friendship", "labyrinth", "mountains", "noteworthy", "paragraph", "refraction", "waterfall",
        "afterglow", "basketball", "caterpillar", "discovery", "expression", "fireworks", "grandchild", "heartbeat", "laboratory", "storyline",
        "adolescent", "bookkeeper", "collective", "description", "everywhere", "goldsmith", "houseplant", "interview", "knowledge", "landowner",
        "afterimage", "backpacker", "clockwork", "downstairs", "friendlier", "greenhouse", "headphones", "lightning", "northbound", "overdrive",
        "blueprint", "conductor", "deepwater", "everybody", "frameworks", "grandstand", "household", "invisible", "jackhammer", "lighthouse",
        "breakfasts", "countryside", "dragonfly", "friendliest", "greenfield", "houseparty", "indigo", "journalist", "kilometer", "lullaby",
        "alphabetic", "bookmarket", "companion", "daybreaks", "earthbound", "fireplace", "goldenrod", "hitchhiker", "intersection", "journeyed",
        "airstrip", "backstory", "cloudburst", "dragonboat", "earthrise", "flashlight", "honeycomb", "illustrate", "keystroke",
        "blacksmith", "cornerstone", "daylighting", "earthquake", "forecastle", "groundwork", "handwritten", "intersection", "jackpot"
    ]

    def __init__(self):
        self.answer = []
        self.curWord = []
        self.guesses = []
        self.errors = []
        self.backup = ''
        self.win = False
        self.loose = False
    # we have two bools for win or lose. This updates them and is ran at the end of the gamplay loop
    def checkWin(self):
        self.win = True
        for char in self.curWord:
            if "_" in char:
                self.win = False 
        self.loose = bool(len(self.errors) >= 6)
    # checks number of current errors and prints hangman dude 
    def printBoard(self):
        numErrors = len(self.errors)
        if numErrors == 0:
            print("   ________")
            print("   |      |")
            print("   |      |")
            print("   |")
            print("   |")
            print("   |")
            print("___|___")
        elif numErrors == 1:
            print("   ________")
            print("   |      |")
            print("   |      |")
            print("   |      O")
            print("   |")
            print("   |")
            print("___|___")
        elif numErrors == 2:
            print("   ________")
            print("   |      |")
            print("   |      |")
            print("   |      O")
            print("   |      |")
            print("   |")
            print("___|___")
        elif numErrors == 3:
            print("   ________")
            print("   |      |")
            print("   |      |")
            print("   |      O")
            print("   |     /|")
            print("   |")
            print("___|___")
        elif numErrors == 4:
            print("   ________")
            print("   |      |")
            print("   |      |")
            print("   |      O")
            print("   |     /|\\")
            print("   |")
            print("___|___")
        elif numErrors == 5:
            print("   ________")
            print("   |      |")
            print("   |      |")
            print("   |      O")
            print("   |     /|\\")
            print("   |     /")
            print("___|___")
        elif numErrors == 6:
            print("   ________")
            print("   |      |")
            print("   |      |")
            print("   |      O")
            print("   |     /|\\")
            print("   |     / \\")
            print("___|___")
    # updates self.answer to a word based on user's choice of difficulty 
    def createAnswerWord(self):
        while True:
            try:
                dif = int(input("1-Easy, 2-Medium, 3-Hard, 4-Two Player? "))
                break 
            except ValueError:
                print("Please enter an integer, 1-3.")
        if dif == 1:
            num = random.randint(2, 6)
        elif dif == 2:
            num = random.randint(6, 12)
        elif dif == 3:
            num = random.randint(10, 14)
        elif dif == 4:
            num = 20

        if num < 20: 
            difDic = {1 : "easy",2 : "medium",3 : "hard"}
            difWord = difDic[dif]
            textOut = self.getGeneratedWord(difWord, num)
            self.backup = textOut
            self.answer = list(textOut)
        elif num == 20: 
            word = input('Input word: ')
            self.backup = word
            self.answer = list(word)

    def getGeneratedWord(self, difWord, num):
        # Original OpenAI-backed word generation preserved for sentiment/reference.
        # openai_key = os.environ.get("OPENAI_KEY") or os.environ.get("OPENAI_API_KEY")
        # if openai_key:
        #     try:
        #         client = openai.OpenAI(api_key=openai_key)
        #         response = client.chat.completions.create(
        #             model="gpt-4o-mini",
        #             messages=[{"role": "user", "content": f"I'm making a hangman game. Please generate an {difWord} difficulty random word with {num} letters. Your response should contain only the word with no formatting and in all lowercase."}],
        #             temperature=.75,
        #         )
        #         textOut = response.choices[0].message.content.strip().lower()
        #         if textOut.isalpha() and len(textOut) == num:
        #             return textOut
        #     except Exception:
        #         pass
        return self.getLocalWord(num)

    def getLocalWord(self, num):
        candidates = [word for word in self.WORD_BANK if len(word) == num]
        if not candidates:
            candidates = [word for word in self.WORD_BANK if abs(len(word) - num) <= 1]
        if not candidates:
            candidates = self.WORD_BANK
        return random.choice(candidates)
    # creates self.curWord for the first time with "__"'s and tells user length of word 
    def initiate(self):
        length = len(self.answer)
        print(f"The word has a length of {length}")
        self.curWord = ["__" for i in range(length)]
    # checks a guess against the answer. Removes correct letters from answer and adds them to curWord. 
    #   handles updates to guesses and errors too
    def runGuess(self, guess):
        if guess not in self.guesses:
            if guess in self.answer:
                indices = []
                for i in range(len(self.answer)):
                    if guess in self.answer[i]:
                        indices.append(i)
                for ind in indices:
                    self.answer[ind] = "__"
                    self.curWord[ind] = guess
                self.guesses.append(guess)
            else: 
                self.guesses.append(guess)
                self.errors.append(guess)
                print("Wrong!")
        else: 
            print('You already guessed that!')
    def clear_terminal(self):
        os.system('cls' if os.name == 'nt' else 'clear')
    # the main game loop. breaks on a win or loss 
    def runGame(self):
        while self.win == False and self.loose == False:
            self.clear_terminal()
            self.printBoard()
            print()
            for char in self.curWord:
                print(char, end = "  ")
            print(f"\n\nGuesses: {self.guesses}")
            guess = input("Enter one letter for your guess: ").lower()
            self.runGuess(guess)
            self.checkWin()
        if self.win:
            self.clear_terminal()
            print()
            for char in self.curWord:
                print(char, end = "  ")
            print("\n\nYou win!")
        elif self.loose:
            self.clear_terminal()
            print()
            print(self.backup.upper())
            print()
            self.printBoard()
            print("\nYou loose!")

def again():
    hold = input("Type anything to play again. ")
    if hold:
        return True
    else:
        return False


def main():
    
    game = gameplay()
    game.clear_terminal()
    game.createAnswerWord()
    print(game.answer)
    game.initiate()
    game.runGame()

    if again():
        main()

if __name__ == "__main__":
    main()