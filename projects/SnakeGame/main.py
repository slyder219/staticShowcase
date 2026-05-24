# -*- coding: utf-8 -*-
"""
Created on Wed Dec 14 17:45:48 2022

@author: seanl
"""

ROWLEN = 12
COLLEN = 12

import random
from random import choice


def make_board(rowLen, colLen):
    totalBoxes = rowLen*colLen
    board = []
    for i in range(1, totalBoxes+1):
        board.append([i, "|_|"])
    return board

def print_board(board, rowLen):
    print()
    print("    ", end = "")
    for i in range(1, rowLen + 1):
        print(f"{i:^3}", end = "")
    print()
    # AI edit
    for i in range(len(board)):
        if board[i][0] % rowLen == 1:
            print(f"{int((board[i][0] - 1) / rowLen) + 1:>2} ", end = "")
        print(board[i][1], end = "")
        if board[i][0] % rowLen == 0 :
            print()

def random_box(board, rowLen):
    # will find a box that is not on an edge
    temp = [box for box in board if box[0] > 12 and box[0] < 133]
    temp2 = []
    for box in temp:
        rem = round(((box[0]/12)-(int(box[0]/12))), 3)
        if rem != 0.083:
            temp2.append(box)
    temp3 = [box for box in temp2 if box[0]%12 != 0]
    return random.choice(temp3)

def random_start_end(board, rowLen):
    # start will be in the first row, end will be in the last 
   starts = []
   for box in board:
        rem = round(((box[0]/12)-(int(box[0]/12))), 3)
        if rem == 0.083:
            starts.append(box)
   ends = []
   for box in board:
        if box[0]%12 == 0:
            ends.append(box)
   start, end = random.choice(starts), random.choice(ends)
   board[start[0]-1][1] = "|S|"
   board[end[0]-1][1] = "|E|"
   return [start[0], end[0]]

def place_bombs(board, rowLen):
    # uses random box to toss 3 bombs in
    for _ in range(3):
        num = random_box(board, rowLen)[0]
        iterNum = num-1
        if "S" not in board[iterNum -1][1]:
            if "E" not in board[iterNum +1][1]:
                board[iterNum][1] = "|B|"
                
def coord_to_box(x, y, rowLen):
    # just translates x,y coord to a box num 
    firstOfRow = (((y*rowLen)-rowLen)+1)
    box = firstOfRow + (x-1)
    return box

def box_to_coord(boxNum, rowLen):
    # translates box nunmber to an x,y coord 
    if boxNum % rowLen != 0:
        y = int((boxNum/rowLen)+1)
    else: 
        y = int(boxNum/rowLen)
    firstOfRow = (((y*rowLen)-rowLen)+1)
    x = ((boxNum - firstOfRow)+1)
    return [x,y]

def get_slash_inputs(board, rowLen): 
    print("\nYou can place 4 reflectors. \nEnter 0 at anytime to stop placing and run the lazer.")
    for _ in range(4):     
        # get good input 
        hold = True 
        while hold:
            try:
                x = int(input("\nEnter X-Coordinate: "))
                if x == 0:
                    print_board(board, rowLen)
                    return 
                y = int(input("Enter Y-Coordinate: "))
                if y == 0:
                    print_board(board, rowLen)
                    return 
                if y > rowLen:
                    print("Please enter coordinates in the range of the board.")
                    continue
                # AI edit
                slash = input("Enter type. \"/\" or \"\\\": ")
                if slash == 0:
                    print_board(board, rowLen)
                    return
                if "/" in slash or "\\" in slash:                    
                    if x <= rowLen:
                        hold = False
                    else: 
                        print("Please enter coordinates in the range of the board.")
                else: 
                    print("Please enter one of the two reflector types.")                   
            except ValueError:
                print("Please enter numbers only")  
        #apply to board 
        if "/" in slash:
            box = (coord_to_box(x, y, rowLen)) - 1 
            board[box][1] = "|/|"
        if "\\" in slash:
            box = (coord_to_box(x, y, rowLen)) - 1
            board[box][1] = "|\\|"
        print_board(board, rowLen) 

def clear_board(board, rowLen):
    # will leave start and points but clear reflector and bombs 
    # not currently available to the user 
    for box in board:
        if "S" not in box[1] and "E" not in box[1]:
            box[1] = "|_|"

def draw_lazer(board, rowLen, curIter):
    # takes whaever iteration we have, draws lazer through empty squares
    #   and stops when square isn't empty and returns contents. 
    for i in range(len(curIter)):
        try:
            # assuming curIter is made up of box numbers, not boxes
            curBox = curIter[i] - 1     # subtract one to use for iteration on board 
            if "_" in board[curBox][1]:
                board[curBox][1] = "|+|"
            else:
                if "B" in board[curBox][1]:
                        print_board(board, ROWLEN)
                        print("BOMB!")
                        return "lose"
                if "E" in board[curBox][1]:
                    print_board(board, ROWLEN)
                    print("End!")
                    return "win"
                if "S" in board[curBox][1]:
                    pass
                else:
                    # wont return E or B, those are handled in this function above 
                    print_board(board, rowLen)
                    return [board[curBox][0], board[curBox][1], curIter[i-1]]
                    # returns format = [boxNum with slash, type of slash, boxNum before slash] 
        except IndexError:
            print("Index Error")
            pass
    print()
    print_board(board, rowLen)
    # AI edit
    
def get_first_iter(startEnd, board, rowLen):
    # only used for the first iter b/c it will always go right from start box 
    start = startEnd[0] # this is a box number 
    output = []
    for i in range(rowLen):
        output.append(start + i)
    return output

def get_next_iter(lastReturn, board, rowLen):
    # returns a new list of box numbers the the lazer needs to go through
    #   in response to hitting a certain reflector 
    try:
        # unpack the info from the last "draw lazer" \/
        hitBox, typeHit, lastBox = lastReturn[0], lastReturn[1], lastReturn[2]
    except TypeError:
        pass
        return
    # coordinate of hitBox \/
    hitCoordX, hitCoordY = box_to_coord(hitBox, ROWLEN)[0], box_to_coord(hitBox, ROWLEN)[1]
    # making a board of coords \/
    coordBoard = [box_to_coord(box[0], ROWLEN) for box in board]
    if "\\" in typeHit:
        if lastBox == (hitBox - 1):
            # from left into a \ : need to go down
            newIterCoords = [coord for coord in coordBoard if coord[0] == hitCoordX and coord[1] > hitCoordY]
            newIterCoords.sort(key = lambda x: x[1])
            newIterBoxes = [coord_to_box(coord[0], coord[1], rowLen) for coord in newIterCoords]
            return newIterBoxes 
        if lastBox == (hitBox - 12):
            # comming from top into \ : must itter right
            newIterCoords = [coord for coord in coordBoard if coord[1] == hitCoordY and coord[0] > hitCoordX]
            newIterCoords.sort(key = lambda x: x[0])
            newIterBoxes = [coord_to_box(coord[0], coord[1], rowLen) for coord in newIterCoords]
            return newIterBoxes
        if lastBox == (hitBox + 12):
            # from bottom into \ : itter left 
            newIterCoords = [coord for coord in coordBoard if coord[1] == hitCoordY and coord[0] < hitCoordX]
            newIterCoords.sort(key = lambda x: x[0], reverse = True)
            newIterBoxes = [coord_to_box(coord[0], coord[1], rowLen) for coord in newIterCoords]
            return newIterBoxes
        if lastBox == (hitBox + 1):
            # from right into \ : itter up
            newIterCoords = [coord for coord in coordBoard if coord[0] == hitCoordX and coord[1] < hitCoordY]
            newIterCoords.sort(key = lambda x: x[1], reverse = True)
            newIterBoxes = [coord_to_box(coord[0], coord[1], rowLen) for coord in newIterCoords]
            return newIterBoxes
    if "/" in typeHit:
        if lastBox == (hitBox - 1): # works
            # coming from left into a / : Need to iter up
            newIterCoords = [coord for coord in coordBoard if coord[0] == hitCoordX and coord[1] < hitCoordY]
            newIterCoords.sort(key = lambda x: x[1], reverse = True)
            newIterBoxes = [coord_to_box(coord[0], coord[1], rowLen) for coord in newIterCoords]
            return newIterBoxes
        if lastBox == (hitBox + 12):
            # coming from buttom into / : need to iter rightwards
            newIterCoords = [coord for coord in coordBoard if coord[1] == hitCoordY and coord[0] > hitCoordX]
            newIterCoords.sort(key = lambda x: x[0])
            newIterBoxes = [coord_to_box(coord[0], coord[1], rowLen) for coord in newIterCoords]
            return newIterBoxes
        if lastBox == (hitBox - 12):
            # comming from top into / : itter left
            newIterCoords = [coord for coord in coordBoard if coord[1] == hitCoordY and coord[0] < hitCoordX]
            newIterCoords.sort(key = lambda x: x[0], reverse = True)
            newIterBoxes = [coord_to_box(coord[0], coord[1], rowLen) for coord in newIterCoords]
            return newIterBoxes 
        if lastBox == (hitBox + 1):
            # coming from right into / : itter down 
            newIterCoords = [coord for coord in coordBoard if coord[0] == hitCoordX and coord[1] > hitCoordY]
            newIterCoords.sort(key = lambda x: x[1])
            newIterBoxes = [coord_to_box(coord[0], coord[1], rowLen) for coord in newIterCoords]
            return newIterBoxes
    
def final_run_lazer(board, rowLen, startEnd):
    # this calls some of the above functions to draw the lazer.
    # it uses the output from get_next_iter to feed into draw lazer each time
    # I wasn't able to loop this but there's a max of 4 reflectors so it's ok
    try:
        second = draw_lazer(board, rowLen, get_first_iter(startEnd, board, rowLen))
        if second == "win" or second == "lose":
            return second
        second = get_next_iter(second, board, rowLen)
        third = draw_lazer(board, rowLen, second)
        if third == "win" or third == "lose":
            return third
        third = get_next_iter(third, board, rowLen)
        fourth = draw_lazer(board, rowLen, third)
        if fourth == "win" or fourth == "lose":
            return fourth
        fourth = get_next_iter(fourth, board, rowLen)
        fifth = draw_lazer(board, rowLen, fourth)
        if fifth == "win" or fifth == "lose":
            return fifth
        fifth = get_next_iter(fifth, board, rowLen)
        final_result = draw_lazer(board, rowLen, fifth)
        if final_result == "win" or final_result == "lose":
            return final_result
    except TypeError:
        pass
    # AI edit

def main():
    board = make_board(ROWLEN, COLLEN)
    startEnd = random_start_end(board, ROWLEN)
    place_bombs(board, ROWLEN)
    print_board(board, ROWLEN)
    print("\nInstructions:\nThe 'S' is where the lazer starts, the 'E' is where it needs to get to. \nThe 'B's are bombs, if the lazer hits one you lose. \nYou can place 4 reflectors to change the direction of the lazer. \nThe '/' reflector will reflect the lazer like this: / \nThe '\\' reflector will reflect the lazer like this: \\ \nGood luck!")
    get_slash_inputs(board, ROWLEN)
    result = final_run_lazer(board, ROWLEN, startEnd)
    if result == "win":
        print("You win!")
    elif result == "lose":
        print("You loose!")
    # AI edit
    again = input("Play again? (Y/N) ")
    if "Y" in again or "y" in again:
        main()
    
   
if __name__ == "__main__":
    main()