import os

def trackedVarReplacer(line, varDict, callOfVarsNum):

    if varDict != {}:

        for key in varDict.keys():

            keyIndex = line.find(key)

            #if key == "newBlob" and keyIndex > -1:
                #print ("HIT!", line, "\n" + str(keyIndex), "Before:", line[keyIndex - 1], "After:", line[keyIndex + len(key)])

            if keyIndex > -1 and trackedVarChecker(line[keyIndex - 1], line[keyIndex + len(key)]):
                callOfVarsNum += 1
                line = variableReplacer(line, key, varDict[key])

    return line, callOfVarsNum

def trackedVarChecker(beforeVar, afterVar):
    isVar = False

    if beforeVar == "(" or afterVar == ")":
        isVar = True
    elif afterVar == ",":
        isVar = True
    elif beforeVar == " " and afterVar == " ":
        isVar = True

    return isVar

def variableReplacer(iptLine, ogVar, rplcVar):

    fileString = iptLine.replace(ogVar, rplcVar)

    return fileString

def contentGrabber(content, skipped):

    objectTypeDict = {
            '"' : 's',
            '[' : 'a',
            '{' : 'o',
            'b' : 'b',
            'i' : 'i'
        }

    if content[0].isalpha() and content[0:3] == 'new':
        objectTypePhrase = '{'
    elif content[0].isnumeric() or content.find('.length') > -1:
        objectTypePhrase = 'i'
    elif content == "true" or content == "false":
        objectTypePhrase = 'b'
    elif content.find('?') > -1 and content[content.find('?'):].find(': ') > -1 :
        if content[content.find('? ') + len('? ')] == content[content.find(': ') + len(': ')] and not content[content.find('? ') + len('? ')].isalpha():
            objectTypePhrase = content[content.find('? ') + len('? ')]
        elif content[content.find('? ') + len('? '):].find('true') > -1 and content[content.find('? ') + len('? '):].find('false') > -1:
            objectTypePhrase = 'b'
        else:
            skipped += 1
            returnValue = None
    elif content.find('this.') > -1 or content.find('.get') > -1:
        skipped += 1
        returnValue = None
    elif content.find('.') > -1:
        skipped += 1
        returnValue = None
    else:
        objectTypePhrase = content[0]

    try:
        returnValue = objectTypeDict.get(objectTypePhrase, "Doesn't exist")
    except:
        pass
    
    if returnValue == None:
        returnValue = ""
    
    return returnValue, skipped

def variableConverter(varName, varContent, lineNum, skipped):
    
    secondPos = varName[1]

    if not secondPos.isupper():

        replacementChar, skipped = contentGrabber(varContent, skipped)

        if replacementChar == "":
            return varName, skipped
        elif replacementChar != "Doesn't exist":
            rplcVar = str(replacementChar) + varName[0].upper() + varName[1:]
            return rplcVar, skipped
        else:
            print (replacementChar + ": on", lineNum, "for", varName)
            quit()
        
    else:
        skipped += 1
        return varName, skipped

def variableFinder(fFile):

    aOutputFile = []
    varDict = {}
    varTypes = ['var ', 'let ', 'const ']
    initVarsChange = 0
    lineNum = 1
    skipped = 0
    callOfVarsNum = 0

    for line in fFile.readlines():

        if line.find(" function") < 0:

            for varType in varTypes:

                if line.rfind(varType) > -1 and line.rfind(" = ") > -1:

                    variable = line[line.rfind(varType) + len(varType):line.rfind(" = ")]
                    content = line[line.rfind(" = ") + len(" = "):]
                    rplcVar, skipped = variableConverter(variable, content, lineNum, skipped)

                    if rplcVar != variable:

                        varDict[variable] = rplcVar
                        line = variableReplacer(line, variable, rplcVar)
                        break

                    else:
                        skipped += 1
                        break

                else:            
                    line, callOfVarsNum = trackedVarReplacer(line, varDict, callOfVarsNum)
                    break
        else:
            initVarsChange += len(varDict) 
            varDict = {}

        aOutputFile.append(line)
        lineNum += 1

    initVarsChange += len(varDict)
    print ('Changed', initVarsChange, 'initial variables,', callOfVarsNum, 'called variables and skipped', skipped)
    return aOutputFile

def main():

    validFileName = False

    while not validFileName:
        fileName = input('Please enter a file name with the ".js" extention: ') + ".js"

        if fileName in os.listdir():
            validFileName = True

    with open(fileName, 'r') as fFile:
        aOutput = variableFinder(fFile)

    with open(fileName, 'w') as fFile:
        for line in aOutput:
            fFile.write(line)

if __name__ == "__main__":
    main()