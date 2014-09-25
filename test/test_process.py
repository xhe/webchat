import time

finishedPoint = 35

from multiprocessing import Process
from multiprocessing import Pool
import os

def finnab(n):
    if n<2:
        return n
    return finnab(n-1)+finnab(n-2)

startTS = time.time()*1000
pool = Pool(processes=4)

results = pool.map(finnab, range(finishedPoint) ) 

i = 0
for result in results:
    f = open('files/python_proc_%d'% i,'w');
    f.write('i=%d, result=%d' % (i, result ) )
    i=i+1
    f.close()
    
endTS =time.time()*1000

print ("finished in %d mill-seconds: " % (endTS-startTS))