#include <vector>
#include <device/Output.h>
#include <device/OutputSerialDefault.h>
#include <device/OutputGPIO.h>
#include <device/OutputSPI1.h>
#include <device/OutputUART.h>
#include <device/OutputPWMbcm2835.h>
#include <device/OutputPWMpigpio.h>
#include <grabber/ColorRgb.h>
#include <grabber/ColorRgba.h>
#include <grabber/Image.h>
#include <thirdparty/json/single_include/nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

struct LedNode
{
    float x_pos;
    float y_pos;
    unsigned r;
    unsigned pos;
    vector<unsigned> positions;
    std::vector<std::vector<float>> gaussian_weight;
    vector<pair<float,unsigned>> gaussian_pos;

    LedNode(float x, float y, unsigned confW, unsigned confH, unsigned screenX, unsigned screenY) :
        LedNode(x, y, 1, confW, confH, screenX, screenY) { };

    LedNode(float x, float y, unsigned r, unsigned confW, unsigned confH, unsigned screenX, unsigned screenY)
    {
        setPosition(x, y, r, confW, confH, screenX, screenY);
    };
    void setPosition(float x, float y, unsigned r, unsigned confW, unsigned confH, unsigned screenX, unsigned screenY)
    {
        // set original positions and radius in config
        x_pos = x;
        y_pos = y;
        this->r = r;
        // map position into screen area
        unsigned mapped_x = unsigned((x / float(confW)) * (screenX / 2));
        unsigned mapped_y = unsigned((y / float(confH)) * (screenY));
        // reset sample points
        positions.clear();
        gaussian_pos.clear();
        // get sampling area boundary
        unsigned min_x = max((int)mapped_x - (int)r, (0));
        unsigned max_x = min((int)mapped_x + (int)r, (int)(screenX / 2));
        unsigned min_y = max((int)mapped_y - (int)r, (0));
        unsigned max_y = min((int)mapped_y + (int)r, (int)screenY);
        // get gaussian kernel
        gaussian_weight = gaussian_filter(r, 1.0);
        // go through pixels to sample
        unsigned samplingResolution = 1;
        for (unsigned ix = min_x; ix < max_x; ix += samplingResolution)
            for (unsigned iy = min_y; iy < max_y; iy += samplingResolution)
            {
                // get 1-dimensional index of pixel in image and add to positions
                unsigned position = iy * screenX + ix;
                positions.emplace_back(position);
                // add 1-dimensional index of pixel and blur weight to vector
                gaussian_pos.emplace_back(gaussian_weight[ix-min_x][iy-min_y], position);
            }
        //cout << "Set LED: " << x_pos << "," << y_pos << " r:" << r << " samples: " << positions.size() << endl;
    }

    std::vector<std::vector<float>> gaussian_filter(int kernel_size = 2, float sigma = 1.0)
    {
        // width of convolution kernel
        int W = (kernel_size * 2) + 1;
        // 2d vector to contain matrix
        std::vector<std::vector<float>> kernel(
            W, std::vector<float>(W, 0.0)
        );
        float mean = W/2;
        float sum = 0.0; // For accumulating the kernel values
        for (int x = 0; x < W; ++x) 
            for (int y = 0; y < W; ++y) {
                kernel[x][y] = exp( -0.5 * (pow((x-mean)/sigma, 2.0) + pow((y-mean)/sigma,2.0)) )
                                / (2 * M_PI * sigma * sigma);

                // Accumulate the kernel values
                sum += kernel[x][y];
            }

        // Normalize the kernel
        for (int x = 0; x < W; ++x)
        {
            for (int y = 0; y < W; ++y)
            {
                kernel[x][y] /= sum;
            }
        }
        return kernel;
    }

};

enum ColorOrder
{
    ORDER_RGB, ORDER_RBG, ORDER_GRB, ORDER_BRG, ORDER_GBR, ORDER_BGR
};

class DeviceManager
{
public:
    DeviceManager(const json &config, unsigned &outputIndex, unsigned &_screenX, unsigned &screenY)
    {
        // set widths of screen
        screenX = _screenX;
        screenHalfX = unsigned(screenX / 2.0f);
        // log output info
        cout << "Output " << outputIndex << ": " << config["outputs"][outputIndex]["type"] << ", LEDs: " << config["outputs"][outputIndex]["leds"].size() << endl;
        cout << config["outputs"][outputIndex]["properties"].dump(2) << endl; // pretty print properties
        // get width and height from config
        unsigned configW = config["window"]["width"];
        unsigned configH = config["window"]["height"];
        // set color order
        if (config["outputs"][outputIndex]["properties"].contains("colorOrder"))
        {
            std::string _order = config["outputs"][outputIndex]["properties"]["colorOrder"];
            if (_order == "rgb")
                colorOrder = ORDER_RGB;
            else if (_order == "rbg")
                colorOrder = ORDER_RBG;
            else if (_order == "grb")
                colorOrder = ORDER_GRB;
            else if (_order == "brg")
                colorOrder = ORDER_BRG;
            else if (_order == "gbr")
                colorOrder = ORDER_GBR;
            else if (_order == "bgr")
                colorOrder = ORDER_BGR;
            else {
                colorOrder = ORDER_RGB;
                std::cout << "invalid color order ('" << _order << "') specified in properties, using default (RGB)" << std::endl;
            }
        } else {
            colorOrder = ORDER_RGB;
            std::cout << "no color order specified in properties, using default (RGB)" << std::endl;
        }
        // add leds
        for (auto &led : config["outputs"][outputIndex]["leds"])
        {
            // check if sampling radius is specified in config
            if (led.contains("r"))
                ledNodes.emplace_back(led["x"], led["y"], led["r"], configW, configH, screenX, screenY);
            else
                ledNodes.emplace_back(led["x"], led["y"], configW, configH, screenX, screenY);
        }
        // get output properties
        const string outputType = config["outputs"][outputIndex]["type"];
        // create output object
        if (outputType == "apa102_spi0")
        {
            output = std::shared_ptr<Output>(new OutputGPIO(config["outputs"][outputIndex]["properties"]));
        }
        else if (outputType == "apa102_spi1")
        {
            output = std::shared_ptr<Output>(new OutputSPI1(config["outputs"][outputIndex]["properties"]));
        }
        else if (outputType == "adalight_uart")
        {
            output = std::shared_ptr<Output>(new OutputUART(config["outputs"][outputIndex]["properties"]));
        }
        else if (outputType == "adalight_serial")
        {
            output = std::shared_ptr<Output>(new OutputSerialDefault(config["outputs"][outputIndex]["properties"]));
        }
        else if (outputType == "pwm_hw")
        {
            output = std::shared_ptr<Output>(new OutputPWMbcm2835(config["outputs"][outputIndex]["properties"]));
        }
        else if (outputType == "pwm_gpio")
        {
            output = std::shared_ptr<Output>(new OutputPWMpigpio(config["outputs"][outputIndex]["properties"]));
        }
        else
        {
            cout << "Error: could not create device output because type not recognised: " << outputType << endl;
        }
    }

    template <typename Pixel_T>
    int update(const Image<Pixel_T> &image, float &brightness, float &desaturation, float &gamma, float &crossfadeNorm)
    {
        std::vector<ColorRgb> ledValues;
        float fadeThreshold = 0.99f;
        bool sampleL = crossfadeNorm < fadeThreshold;
        bool sampleR = crossfadeNorm > (1.0f - fadeThreshold);
        // get colours
        for (auto &ledNode : ledNodes)
        {
            // initialise colours
            uint8_t avgR_L = 0;
            uint8_t avgG_L = 0;
            uint8_t avgB_L = 0;
            uint8_t avgR_R = 0;
            uint8_t avgG_R = 0;
            uint8_t avgB_R = 0;
            uint8_t avgR = 0;
            uint8_t avgG = 0;
            uint8_t avgB = 0;

            // get colors on left side
            if (sampleL)
            {
                // initialise colour accumulator
                float accR = 0.0;
                float accG = 0.0;
                float accB = 0.0;
                // iterate through pixels
                for (const auto& elem : ledNode.gaussian_pos)
                {
                    // get pixel address
                    const Pixel_T &pixel = image.memptr()[elem.second];
                    // sample color from pixel and multiply by convolution kernel weight
                    accR += elem.first * pixel.red;
                    accG += elem.first * pixel.green;
                    accB += elem.first * pixel.blue;
                }
                // cast color type
                avgR_L = uint8_t(accR);
                avgG_L = uint8_t(accG);
                avgB_L = uint8_t(accB);
            }
            // get colours on right side
            if (sampleR)
            {
                // initialise colour accumulator
                float accR = 0.0;
                float accG = 0.0;
                float accB = 0.0;
                // iterate through pixels
                for (const auto& elem : ledNode.gaussian_pos)
                {
                    // get pixel address (add display width / 2 to get right hand side)
                    const Pixel_T &pixel = image.memptr()[elem.second + screenHalfX];
                    // sample color from pixel and multiply by convolution kernel weight
                    accR += elem.first * pixel.red;
                    accG += elem.first * pixel.green;
                    accB += elem.first * pixel.blue;
                }
                // cast color type
                avgR_R = uint8_t(accR);
                avgG_R = uint8_t(accG);
                avgB_R = uint8_t(accB);
            }

            // set final LED colour
            if (sampleL && sampleR)
            {
                // interpolate (fade)
                avgR = uint8_t(avgR_L + crossfadeNorm * (avgR_R - avgR_L));
                avgG = uint8_t(avgG_L + crossfadeNorm * (avgG_R - avgG_L));
                avgB = uint8_t(avgB_L + crossfadeNorm * (avgB_R - avgB_L));
            }
            else
            {
                // absolute
                avgR = sampleL ? avgR_L : avgR_R;
                avgG = sampleL ? avgG_L : avgG_R;
                avgB = sampleL ? avgB_L : avgB_R;
            }
            
            // apply desaturation
            if (desaturation > 0.0f) {
                // calculate avg luminosity
                float gray = (0.2989*avgR) + (0.5870*avgG) + (0.1140*avgB); //weights from CCIR 601 spec
                // mix gray and colour channels
                avgR = uint8_t(gray * desaturation + avgR * (1.0-desaturation));
                avgG = uint8_t(gray * desaturation + avgG * (1.0-desaturation));
                avgB = uint8_t(gray * desaturation + avgB * (1.0-desaturation));
            }

            // apply gamma 255 * (Image/255)^(1/2.2)
            avgR = uint8_t(255 * pow(avgR/255.0f, 1.0f/gamma));
            avgG = uint8_t(255 * pow(avgG/255.0f, 1.0f/gamma));
            avgB = uint8_t(255 * pow(avgB/255.0f, 1.0f/gamma));

            // apply brightness
            avgR = uint8_t(avgR * brightness);
            avgG = uint8_t(avgG * brightness);
            avgB = uint8_t(avgB * brightness);

            // define {R, G, B} as colour object
            ColorRgb col = {avgR, avgG, avgB};

            // correct colour order
            switch (colorOrder)
            {
            case ORDER_RGB:
                // leave as is ORDER_RGB, ORDER_RBG, ORDER_GRB, ORDER_BRG, ORDER_GBR, ORDER_BGR
                break;
            case ORDER_RBG:
                std::swap(col.green, col.blue);
                break;
            case ORDER_GRB:
                std::swap(col.red, col.green);
                break;
            case ORDER_BRG:
            {
                std::swap(col.red, col.blue);
                std::swap(col.green, col.blue);
                break;
            }
            case ORDER_GBR:
            {
                std::swap(col.red, col.green);
                std::swap(col.green, col.blue);
                break;
            }
            case ORDER_BGR:
                std::swap(col.red, col.blue);
                break;
            }

            // add colour to list
            ledValues.emplace_back(col);
            //cout << col << endl;
        }
        // write LED colours to device
        return output->write(ledValues);
    }
    ~DeviceManager()
    {
    }
    vector<LedNode> ledNodes;
    std::shared_ptr<Output> output;
    ColorOrder colorOrder;
    unsigned screenX;
    unsigned screenHalfX;

private:
    //
};