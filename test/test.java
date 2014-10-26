import java.util.Calendar;
import java.util.Date;

public class test{
	
	public static void main(String[] args)
	{	
		long lDateTime = new Date().getTime();
		
		for(int i=0; i< Integer.parseInt( args[0] ); i++ ){
			System.out.print("i=" + i +", fib is " + finnab(i) +"\n");
		}
		
		long lDateTime_end = new Date().getTime();
		
		System.out.print ("Total Time used: " + (lDateTime_end-lDateTime) +"\nFinished");
	}
	
	public static int finnab(int i){
		if(i==0){
			return 0;
		}else if(i==1){
			return 1;
		}else{
			return finnab(i-1)+finnab(i-2);
		}
	}
	
}