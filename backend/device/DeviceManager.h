#include <vector>
#include <climits>
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
    LedNode(unsigned x, unsigned y, unsigned r, unsigned width, unsigned height)
    {
        setPosition(x, y, r, width, height);
    };
    void setPosition(unsigned x, unsigned y, unsigned r, unsigned width, unsigned height)
    {
        // set absolute position and radius
        x_pos = x;
        y_pos = y;
        this->r = r;
        // reset sample points
        positions.clear();
        // get sampling area boundary
        unsigned min_x = max((int)x_pos - (int)r, (0));
        unsigned max_x = min((int)x_pos + (int)r, (int)width);
        unsigned min_y = max((int)y_pos - (int)r, (0));
        unsigned max_y = min((int)y_pos + (int)r, (int)height);
        // go through pixels to sample
        for (unsigned ix = min_x; ix < max_x; ix++)
            for (unsigned iy = min_y; iy < max_y; iy++)
            {
                // get 1-dimensional index of pixel in image and add to positions
                unsigned position = iy * width + ix;
                positions.emplace_back(position);
            }
        //cout << "Set LED: " << x_pos << "," << y_pos << " r:" << r << " samples: " << positions.size() << endl;
    }
};

class DeviceManager
{
  public:
    DeviceManager(const json &config, unsigned &outputIndex)
    {
        //
        cout << "Output: " << config["outputs"][outputIndex]["properties"]["port"] << endl;
        unsigned width = config["window"]["width"];
        unsigned height = config["window"]["height"];
        // add leds
        for (auto &led : config["outputs"][outputIndex]["leds"])
        {
            ledNodes.emplace_back(led["x"], led["y"], led["r"], width, height);
        }
        // create output object
        const string deviceName = config["outputs"][outputIndex]["properties"]["port"];
        nameTEMP = config["outputs"][outputIndex]["properties"]["port"];
        const unsigned baudRate = config["outputs"][outputIndex]["properties"]["rate"];
        output = std::shared_ptr<Output>(new OutputSerialDefault(deviceName, baudRate));
    }

    template <typename Pixel_T>
    int update(const Image<Pixel_T> &image, unsigned char &brightness)
    {
        std::vector<ColorRgb> ledValues;
        // get colours
        for (auto &ledNode : ledNodes)
        {
            // get sum of colours
            uint_fast16_t cummR = 0;
            uint_fast16_t cummG = 0;
            uint_fast16_t cummB = 0;
            for (unsigned position : ledNode.positions)
            {
                const Pixel_T &pixel = image.memptr()[position];
                cummR += pixel.red;
                cummG += pixel.green;
                cummB += pixel.blue;
            }
            // compute mean average of each colours
            uint8_t avgR = uint8_t(cummR / ledNode.positions.size());
            uint8_t avgG = uint8_t(cummG / ledNode.positions.size());
            uint8_t avgB = uint8_t(cummB / ledNode.positions.size());
            // apply brightness TODO: check works
            avgR *= brightness/UCHAR_MAX;
            avgG *= brightness/UCHAR_MAX;
            avgB *= brightness/UCHAR_MAX;
            // store colour
            ColorRgb col = {avgR, avgG, avgB};
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

  private:
    //
};