#include "opencv2/highgui/highgui.hpp"
#include <iostream>

using namespace std;
using namespace cv;

int main(int argc, char** argv){
    VideoCapture cap(-1);
    if (!cap.isOpened())
    {
        cout << "Cannot open camera" << endl;
        return -1;
    }
   cap.set(CV_CAP_PROP_FRAME_WIDTH, 640);
   cap.set(CV_CAP_PROP_FRAME_HEIGHT, 480);

   namedWindow("Output",CV_WINDOW_AUTOSIZE);

    while (1)
    {
        Mat frame;
        bool bSuccess = cap.read(frame);

        if (!bSuccess)
        {
        cout << "Cannot read a frame from camera" << endl;
        break;
        }
        imshow("Output", frame);

        if (waitKey(30) == 27)
        {
        cout << "Exit" << endl;
        break;
        }
    }
    return 0;
}
