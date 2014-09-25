import time

finishedPoint = 35

def finnab(n):
    if n<2:
        return n
    return finnab(n-1)+finnab(n-2)
startTS = time.time()*1000

for i in range(0, finishedPoint):
    f = open('files/python_%d'% i,'w');
    f.write('i=%d, result=%d' % (i,finnab(i)) )
    f.close()

endTS =time.time()*1000

print ("finished in %d mill-seconds: " % (endTS-startTS))