#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <X11/extensions/Xrender.h>
#include <X11/extensions/XShm.h>
#include <sys/ipc.h>
#include <sys/shm.h>

#include <iostream>

using namespace std;

struct ScreenShot
{
    ScreenShot(int x, int y, int width, int height):
        x(x),
        y(y),
        width(width),
        height(height)
    {
        display = XOpenDisplay(NULL);
        root = DefaultRootWindow(display);

        init = true;
    }

    void operator() ()
    {
        if(init == true)
            init = false;
        else
            XDestroyImage(img);

        img = XGetImage(display, root, x, y, width, height, AllPlanes, ZPixmap);
		
		for(int i=0; i<144; i++){
			XColor c;
			c.pixel = XGetPixel(img, 912, 492);
			XQueryColor (display, DefaultColormap(display, DefaultScreen (display)), &c);
		    if(i==0)cout << c.red/256 << " " << c.green/256 << " " << c.blue/256 << "\n" ;
		}
    }

    ~ScreenShot()
    {
        if(init == false)
            XDestroyImage(img);

        XCloseDisplay(display);
    }

    Display* display;
    Window root;
    int x,y,width,height;
    XImage* img;

    bool init;
};

int main()
{
	int screenW = 1824; int screenH = 984;
    ScreenShot screen(0,0,screenW,screenH);
	int frame = 0;

	int x = 912; int y = 492;
    while(1){

    	screen();

		frame++;
		cout << "Frame: " << frame << endl;
	}
    return 0;
}
