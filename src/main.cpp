#include <iostream>
#include <cassert>
#include <fstream>

#pragma GCC system_header
#include <bcm_host.h>

#include <Image.h>
#include <ColorRgba.h>

using namespace std;

int main()
{
    bcm_host_init();

    // Create the resources for capturing image
    uint32_t vc_nativeImageHandle;
    // Handle to the resource for storing the captured snapshot // Create the resources for capturing image
    DISPMANX_RESOURCE_HANDLE_T _vc_resource = vc_dispmanx_resource_create(
        VC_IMAGE_RGBA32,
        720,
        480,
        &vc_nativeImageHandle);
    assert(_vc_resource);

    /// Rectangle of the captured resource that is transfered to user space
    VC_RECT_T _rectangle;

    // Define the capture rectangle with the same size
    vc_dispmanx_rect_set(&_rectangle, 0, 0, 720, 480);

    // open displauy
    DISPMANX_DISPLAY_HANDLE_T _vc_display = vc_dispmanx_display_open(0);
    if (_vc_display < 0)
    {
        std::cout << "DISPMANXGRABBER ERROR: Cannot open display: " << _vc_display << std::endl;
        return 0;
    }
    assert(_vc_display > 0);
    // Obtain the display information
    DISPMANX_MODEINFO_T vc_info;
    int result = vc_dispmanx_display_get_info(_vc_display, &vc_info);
    // Keep compiler happy in 'release' mode
    (void)result;
    assert(result == 0);
    std::cout << "INFO: Display opened with resolution: " << vc_info.width << "x" << vc_info.height << std::endl;

    // Define the capture rectangle with the same size
    vc_dispmanx_rect_set(&_rectangle, 0, 0, vc_info.width, vc_info.height);

    int ret;
    int _vc_flags;

    // Create the snapshot (incl down-scaling)
    ret = vc_dispmanx_snapshot(_vc_display, _vc_resource, (DISPMANX_TRANSFORM_T)_vc_flags);
    if (ret < 0)
    {
        std::cout << "ERROR: Snapshot failed: " << ret << std::endl;
        vc_dispmanx_display_close(_vc_display);
        return 0;
    }

    // This memory will hold the screenshot.
    Image<ColorRgba> image(vc_info.width, vc_info.height);
    // Read the snapshot into the memory
    void *imagePtr = image.memptr();
    void *capturePtr = imagePtr;

    unsigned imagePitch = vc_info.width * sizeof(ColorRgba);

    // dispmanx seems to require the pitch to be a multiple of 64
    unsigned capturePitch = (_rectangle.width * sizeof(ColorRgba) + 63) & (~63);

    ret = vc_dispmanx_resource_read_data(_vc_resource, &_rectangle, capturePtr, capturePitch);
    if (ret < 0)
    {
        std::cout << "ERROR: vc_dispmanx_resource_read_data failed: " << ret << std::endl;
        vc_dispmanx_display_close(_vc_display);
        return 0;
    }

    // try write ppm file
    ofstream myfile;
    myfile.open("screenshot.ppm");
    myfile << "P3 720 480 255\n";
    for (int y = 0; y < image.height(); y++)
    {
        for (int x = 0; x < image.width(); x++)
        {
            myfile << image(x, y)[0];
            myfile << " ";
            myfile << image(x, y)[1];
            myfile << " ";
            myfile << image(x, y)[2];
            //cout << "pixel(" << x << "," << y << ") = " << image(x, y) << " r:" << image(x, y).red << " g:" << image(x, y).green << " b:" << image(x, y).blue << endl;
            if (y != image.height() - 1)
            {
                if (x == image.width() - 1)
                {
                    myfile << "\n";
                }
                else
                {
                    myfile << " ";
                }
            }
        }
    }
    myfile.close();

    // Close the displaye
    vc_dispmanx_display_close(_vc_display);

    // Clean up resources
    vc_dispmanx_resource_delete(_vc_resource);

    // De-init BCM
    bcm_host_deinit();

    cout << "Hello and goodbye, World!";
    return 0;
}