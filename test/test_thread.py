import time

finishedPoint = 35

import threading

class myThread (threading.Thread):
    def __init__(self, number):
        threading.Thread.__init__(self)
        self.num = number
    def run(self):
        
        def finnab(n):
            if n<2:
                return n
            return finnab(n-1) + finnab(n-2)
        
        self.result = finnab(self.num)
    
startTS = time.time()*1000

threads = []
for i in range(0, finishedPoint):
    t = myThread(i)
    t.start()
    threads.append(t)

for t in threads:
    t.join()
    
for t in threads:
    f = open('files/python_%d'% t.num,'w');
    f.write('i=%d, result=%d' % (t.num, t.result ) )
    f.close()

endTS =time.time()*1000

print ("finished in %d mill-seconds: " % (endTS-startTS))