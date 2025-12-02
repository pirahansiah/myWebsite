import cProfile,pstats
def fib(n):
    if n <= 1:
        return n
    else:
        return fib(n-1) + fib(n-2)
def main():
    print("Fibonacci of 35 is:", fib(35))

profiler = cProfile.Profile()
profiler.enable();main();profiler.disable()
stats = pstats.Stats(profiler).sort_stats('cumtime')
stats.print_stats()