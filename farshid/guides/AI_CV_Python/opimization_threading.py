
import threading
import time
import os

def fib_iter(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

FIB = 300000
THREADS = os.cpu_count() or 1
REPEAT = 10
SINGLE_RUNS = THREADS * REPEAT

t0 = time.time()
for _ in range(SINGLE_RUNS):
    fib_iter(FIB)
t1 = time.time()

single = t1 - t0

def worker():
    for _ in range(REPEAT):
        fib_iter(FIB)

threads = [threading.Thread(target=worker) for _ in range(THREADS)]
t2 = time.time()
for th in threads:
    th.start()
for th in threads:
    th.join()
t3 = time.time()

multi = t3 - t2

print(f"{single} {multi}")



