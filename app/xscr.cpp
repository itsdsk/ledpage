#include <opencv2/opencv.hpp>
#include "opencv2/highgui/highgui.hpp"

#include <X11/Xlib.h>
#include <X11/Xutil.h>

#include <iostream>

using namespace std;
using namespace cv;

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

    void operator() (Mat& cvImg)
    {
        if(init == true)
            init = false;
        else
            XDestroyImage(img);

        img = XGetImage(display, root, x, y, width, height, AllPlanes, ZPixmap);

        cvImg = Mat(height, width, CV_8UC4, img->data);
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

	Mat img;
   	//screen(img);
	//imwrite("savedImg.jpg", img);
	int x = 912; int y = 492;
    while(1){
		//cout << "Width: " << img.cols << endl;
		//cout << "Height: " << img.rows << endl;

    	screen(img);
		uchar b = img.data[img.channels()*(img.cols*y + x) + 0];    
		uchar g = img.data[img.channels()*(img.cols*y + x) + 1];
		uchar r = img.data[img.channels()*(img.cols*y + x) + 2];
		cout << "b: " << b << endl;
		cout << "g: " << g << endl;
		cout << "r: " << r << endl;

        //Vec3b colour = img.at<Vec3b>(Point(500, 500));
		//cout << "val0: " << colour.val[0] << endl;
	}
    //imshow("img", img);
    //waitKey(0);        
    return 0;
}
