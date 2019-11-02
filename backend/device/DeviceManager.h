#include <vector>
#include <device/Output.h>
#include <device/OutputSerialDefault.h>
#include <grabber/ColorRgb.h>
#include <grabber/ColorRgba.h>
#include <grabber/Image.h>
#include <thirdparty/json/single_include/nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

struct LedNode
{
    unsigned x_pos;
    unsigned y_pos;
    unsigned r;
    unsigned pos;
    vector<unsigned> positions;
    LedNode(unsigned x, unsigned y, unsigned r, unsigned confW, unsigned confH, unsigned screenX, unsigned screenY)
    {
        setPosition(x, y, r, confW, confH, screenX, screenY);
    };
    void setPosition(unsigned x, unsigned y, unsigned r, unsigned confW, unsigned confH, unsigned screenX, unsigned screenY)
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
        // get sampling area boundary
        unsigned min_x = max((int)mapped_x - (int)r, (0));
        unsigned max_x = min((int)mapped_x + (int)r, (int)(screenX / 2));
        unsigned min_y = max((int)mapped_y - (int)r, (0));
        unsigned max_y = min((int)mapped_y + (int)r, (int)screenY);
        // go through pixels to sample
        unsigned samplingResolution = 2;
        for (unsigned ix = min_x; ix < max_x; ix+=samplingResolution)
            for (unsigned iy = min_y; iy < max_y; iy+=samplingResolution)
            {
                // get 1-dimensional index of pixel in image and add to positions
                unsigned position = iy * screenX + ix;
                positions.emplace_back(position);
            }
        //cout << "Set LED: " << x_pos << "," << y_pos << " r:" << r << " samples: " << positions.size() << endl;
    }
};

class DeviceManager
{
  public:
    DeviceManager(const json &config, unsigned &outputIndex, unsigned &_screenX, unsigned &screenY)
    {
        screenX = _screenX;
        screenHalfX = unsigned(screenX/2.0f);
        //
        cout << "Output: " << config["outputs"][outputIndex]["properties"]["port"] << endl;
        unsigned configW = config["window"]["width"];
        unsigned configH = config["window"]["height"];
        // add leds
        for (auto &led : config["outputs"][outputIndex]["leds"])
        {
            ledNodes.emplace_back(led["x"], led["y"], led["r"], configW, configH, screenX, screenY);
        }
        // create output object
        const string deviceName = config["outputs"][outputIndex]["properties"]["port"];
        nameTEMP = config["outputs"][outputIndex]["properties"]["port"];
        const unsigned baudRate = config["outputs"][outputIndex]["properties"]["rate"];
        output = std::shared_ptr<Output>(new OutputSerialDefault(deviceName, baudRate));
    }

    template <typename Pixel_T>
    int update(const Image<Pixel_T> &image, float &brightness, float &crossfadeNorm)
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
            if (sampleL) {
                // initialise sum of colours
                uint_fast16_t cummR = 0;
                uint_fast16_t cummG = 0;
                uint_fast16_t cummB = 0;
                // iterate through pixels
                for (unsigned position : ledNode.positions)
                {
                    // get pixel address
                    const Pixel_T &pixel = image.memptr()[position];
                    // sample colour from pixel
                    cummR += pixel.red;
                    cummG += pixel.green;
                    cummB += pixel.blue;
                }
                // calc mean average of sampled colours
                avgR_L = uint8_t(cummR / ledNode.positions.size());
                avgG_L = uint8_t(cummG / ledNode.positions.size());
                avgB_L = uint8_t(cummB / ledNode.positions.size());
            }
            // get colours on right side
            if (sampleR) {
                // initialise sum of colours
                uint_fast16_t cummR = 0;
                uint_fast16_t cummG = 0;
                uint_fast16_t cummB = 0;
                // iterate through pixels
                for (unsigned position : ledNode.positions)
                {
                    // get pixel address (add display width / 2 to get right hand side)
                    const Pixel_T &pixel = image.memptr()[position + screenHalfX];
                    // sample colour from pixel
                    cummR += pixel.red;
                    cummG += pixel.green;
                    cummB += pixel.blue;
                }
                // calc mean average of sampled colours
                avgR_R = uint8_t(cummR / ledNode.positions.size());
                avgG_R = uint8_t(cummG / ledNode.positions.size());
                avgB_R = uint8_t(cummB / ledNode.positions.size());
            }

            // set final LED colour
            if (sampleL && sampleR) {
                // interpolate (fade)
                avgR = uint8_t(avgR_L + crossfadeNorm * (avgR_R - avgR_L));
                avgG = uint8_t(avgG_L + crossfadeNorm * (avgG_R - avgG_L));
                avgB = uint8_t(avgB_L + crossfadeNorm * (avgB_R - avgB_L));
            } else {
                // absolute
                avgR = sampleL ? avgR_L : avgR_R;
                avgG = sampleL ? avgG_L : avgG_R;
                avgB = sampleL ? avgB_L : avgB_R;
            }

            // apply brightness
            avgR = uint8_t(avgR * brightness);
            avgG = uint8_t(avgG * brightness);
            avgB = uint8_t(avgB * brightness);

            // store colour {R, G, B}
            ColorRgb col = {avgB, avgG, avgR}; // temp switch RGB -> BGR **TODO: IMPLEMENT COLOR ORDER PROPERLY**
            ledValues.emplace_back(col);
            //cout << col << endl;
        }
        return output->write(ledValues);
    }
    ~DeviceManager()
    {
    }
    vector<LedNode> ledNodes;
    std::shared_ptr<Output> output;
    string nameTEMP;
    unsigned screenX;
    unsigned screenHalfX;

  private:
    //
};