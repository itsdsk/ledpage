#include <stdio.h>
#include <stdlib.h>
#define SIZE 76800 // number of pixels (320x240 for my webcam)
int main() {
    cout << "start" << endl;
    FILE *camera, *grab;
    camera=fopen("/dev/video0", "rb");
    //grab=fopen("grab.jpeg", "wb");
    float data[SIZE];
    fread(data, sizeof(data[0]), SIZE, camera);
    cout << "finish" << endl;
    //fwrite(data, sizeof(data[0]), SIZE, grab);
    fclose(camera);
    //fclose(grab); 
    return 0;
}
