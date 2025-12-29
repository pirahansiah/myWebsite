# from numpy import size


# print("farshid")
# filepath = "farshid/guides/src/input3.txt"

# with open(filepath, "r") as f:
# 	for lin in f:
# 		for word in lin.split():
# 			first_digit = 1
# 			second_digit = 1
# 			for i,char in enumerate(word):
# 				if (i<size(word)):    
# 					if first_digit < int(char):
# 						first_digit = int(char)
# 						continue
# 				if second_digit < int(char):
# 					second_digit = int(char)
# 					continue    
# 			print(first_digit ,second_digit)
# 			#print(second_digit )

def find_max_joltage(bank):
    max_joltage = 0
    for i in range(len(bank)):
        for j in range(i + 1, len(bank)):
            joltage = int(bank[i] + bank[j])
            max_joltage = max(max_joltage, joltage)
            print(f"Current pair: ({bank[i]}, {bank[j]}) -> Joltage: {joltage}")
    return max_joltage

filepath = "farshid/guides/src/input3.txt"
total = 0

with open(filepath, "r") as f:
    for line in f:
        line = line.strip()
        if line:
            total += find_max_joltage(line)

print(f"Total output joltage: {total}")
