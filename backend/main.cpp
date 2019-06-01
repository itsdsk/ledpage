#include <iostream>
#include <fstream>
#include <vector>
#include <climits>
#include <unistd.h>
#include <signal.h>

#include <device/DeviceManager.h>
#include <grabber/Image.h>
#include <grabber/ColorRgba.h>
#include <grabber/Grabber.h>

#include <boost/thread/thread.hpp>
#include <thirdparty/json/single_include/nlohmann/json.hpp>
#include <thirdparty/cxxopts/include/cxxopts.hpp>
#include <thirdparty/websocketpp/websocketpp/server.hpp>
#include <websocketpp/config/asio_no_tls.hpp>

#include <cstdio>
#include <boost/array.hpp>
#include <boost/bind.hpp>
#include <boost/enable_shared_from_this.hpp>
#include <boost/shared_ptr.hpp>
#include <boost/asio.hpp>

using boost::asio::local::stream_protocol;

std::string on_socket_message(std::string message);

class session
  : public boost::enable_shared_from_this<session>
{
public:
  session(boost::asio::io_service& io_service)
    : socket_(io_service)
  {
  }

  stream_protocol::socket& socket()
  {
    return socket_;
  }

  void start()
  {
    socket_.async_read_some(boost::asio::buffer(data_),
        boost::bind(&session::handle_read,
          shared_from_this(),
          boost::asio::placeholders::error,
          boost::asio::placeholders::bytes_transferred));
  }

  void handle_read(const boost::system::error_code& error,
      size_t bytes_transferred)
  {
    if (!error)
    {
        std::string receivedData(data_.begin(), data_.begin() + bytes_transferred);
        std::cout << "received data: " << receivedData << std::endl;
        std::cout << "length: " << bytes_transferred << std::endl;
        std::string rtrn = on_socket_message(receivedData);
      boost::asio::async_write(socket_,
          boost::asio::buffer(rtrn, rtrn.length()),
          boost::bind(&session::handle_write,
            shared_from_this(),
            boost::asio::placeholders::error));
    //   boost::asio::async_write(socket_,
    //       boost::asio::buffer(data_, bytes_transferred),
    //       boost::bind(&session::handle_write,
    //         shared_from_this(),
    //         boost::asio::placeholders::error));
    }
  }

  void handle_write(const boost::system::error_code& error)
  {
    if (!error)
    {
      socket_.async_read_some(boost::asio::buffer(data_),
          boost::bind(&session::handle_read,
            shared_from_this(),
            boost::asio::placeholders::error,
            boost::asio::placeholders::bytes_transferred));
    }
  }

private:
  // The socket used to communicate with the client.
  stream_protocol::socket socket_;

  // Buffer used to store data received from the client.
  boost::array<char, 1024> data_;
};

typedef boost::shared_ptr<session> session_ptr;

class server1
{
public:
  server1(boost::asio::io_service& io_service, const std::string& file)
    : io_service_(io_service),
      acceptor_(io_service, stream_protocol::endpoint(file))
  {
    session_ptr new_session(new session(io_service_));
    acceptor_.async_accept(new_session->socket(),
        boost::bind(&server1::handle_accept, this, new_session,
          boost::asio::placeholders::error));
  }

  void handle_accept(session_ptr new_session,
      const boost::system::error_code& error)
  {
    if (!error)
    {
      new_session->start();
    }

    new_session.reset(new session(io_service_));
    acceptor_.async_accept(new_session->socket(),
        boost::bind(&server1::handle_accept, this, new_session,
          boost::asio::placeholders::error));
  }

private:
  boost::asio::io_service& io_service_;
  stream_protocol::acceptor acceptor_;
};

using namespace std;
using json = nlohmann::json;

// websocketpp
typedef websocketpp::server<websocketpp::config::asio> server;
using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
typedef server::message_ptr message_ptr;

vector<DeviceManager> deviceManagers;
unsigned _w;
unsigned _h;
float brightness = 0.15f;
bool receivedScreenshotCommand = false;
bool receivedQuitSignal = false;

void on_message(server *s, websocketpp::connection_hdl hdl, message_ptr msg);

void saveScreenshot(Image<ColorRgba> &_image);

void exitHandler(int s);

int main(int argc, char *argv[])
{
    // ctrl-c (exit) signal handling
    struct sigaction sigIntHandler;
    sigIntHandler.sa_handler = exitHandler;
    sigemptyset(&sigIntHandler.sa_mask);
    sigIntHandler.sa_flags = 0;
    sigaction(SIGINT, &sigIntHandler, NULL);

    // command line options
    cxxopts::Options options("Disk", "Display Web Media on LEDs from Raspberry Pi");
    options.add_options()("s,screenshot", "Save screenshot as .PPM")("d,display", "Display screenshot on device")("c,config", "Config file path", cxxopts::value<std::string>()->default_value("/home/pi/disk/renderer/config.json"));
    auto result = options.parse(argc, argv);

    // read config file
    std::string confFilePath = result["c"].as<std::string>();
    std::cout << "Config file path: " << confFilePath << std::endl;
    std::ifstream confFile(confFilePath);
    json config;
    confFile >> config;

    // add output objects based on config
    for (unsigned i = 0; i < config["outputs"].size(); i++)
    {
        deviceManagers.emplace_back(config, i);
    }

    // unix sock server
    const char* sockPath = "/tmp/backend.sock";
    boost::asio::io_service io_service1;
    std::remove(sockPath);
    server1 s(io_service1, sockPath);
    //io_service1.run();
    boost::thread t1(boost::bind(&boost::asio::io_service::run, boost::ref(io_service1)));

    // websockets server
    server ws_server;
    boost::asio::io_service io_service;
    try
    {
        // todo: add exception handling e.g. https://mayaposch.wordpress.com/2015/09/16/creating-a-websocket-server-with-websocket/
        ws_server.init_asio(&io_service);
        ws_server.set_message_handler(bind(&on_message, &ws_server, ::_1, ::_2));
        ws_server.set_reuse_addr(true);
        ws_server.listen(9002);
        ws_server.start_accept();
        boost::thread t(boost::bind(&boost::asio::io_service::run, boost::ref(io_service)));
        cout << "WebSocket server listening on port 9002" << endl;
    }
    catch (websocketpp::exception const &e)
    {
        std::cout << e.what() << std::endl;
    }
    catch (...)
    {
        std::cout << "other exception" << std::endl;
    }

    // create framegrabber and image object
    _w = config["window"]["width"];
    _h = config["window"]["height"];
    cout << "config window size: " << _w << " x " << _h << endl;
    FrameGrabber *grabber = new FrameGrabber(_w, _h);
    Image<ColorRgba> _image(_w, _h);

    // display screen on device
    while (receivedQuitSignal == false)
    {
        grabber->grabFrame(_image);
        //
        if(receivedScreenshotCommand)
        {
            saveScreenshot(_image);
            receivedScreenshotCommand = false;
        }
        for (auto &deviceManager : deviceManagers)
        {
            deviceManager.update(_image, brightness);
        }
    }

    delete grabber;
    cout << "Exiting grabber" << endl;
    return 0;
}

void saveScreenshot(Image<ColorRgba> &_image)
{
    // write ppm file
    ofstream myfile;
    myfile.open("screenshot.ppm");
    myfile << "P6"
           << "\n"
           << _image.width() << " " << _image.height() << "\n"
           << 255 << "\n";
    for (uint_least32_t y = 0; y < _image.height(); y++)
    {
        for (uint_least32_t x = 0; x < _image.width(); x++)
        {
            myfile << _image(x, y).red;
            myfile << _image(x, y).green;
            myfile << _image(x, y).blue;
        }
    }
    cout << "Saving screenshot" << endl;
    myfile.close();
}

std::string on_socket_message(std::string message)
{
    std::cout << "on socke tmessage got : " << message << std::endl;
    return "reyfbkhybkueysbvkjbvheukbhsvh";
}

void on_message(server *s, websocketpp::connection_hdl hdl, message_ptr msg)
{
    try
    {
        // parse msg received as json
        auto jdata = json::parse(msg->get_payload());
        //cout << "payload:" << jdata.dump(2) << endl;
        // go through top level of JSON object received
        for (auto &element1 : jdata.items())
        {
            string key1 = element1.key();
            if (key1 == "outputs")
            {
                // received an entry for "outputs", go through items in this array
                for (auto &element2 : (element1.value()).items())
                {
                    // get this output device index
                    if (element2.value().find("index") != element2.value().end())
                    {
                        int outputIndex = element2.value()["index"];
                        // look for LEDs in json
                        if (element2.value().find("leds") != element2.value().end())
                        {
                            // loop through objects in LEDs array
                            for (auto &ledElement : element2.value()["leds"].items())
                            {
                                // get new values for LED
                                int index = ledElement.value()["index"];
                                int x = ledElement.value()["x"];
                                int y = ledElement.value()["y"];
                                int r = ledElement.value()["r"];
                                // log
                                cout << "Received LED in device \"" << deviceManagers[outputIndex].nameTEMP << "\" at index " << index << " position " << x << "," << y << " r:" << r << endl;
                                // set led node position and radius
                                deviceManagers[outputIndex].ledNodes[index].setPosition(x, y, r, _w, _h);
                            }
                        }
                    }
                    else
                    {
                        cout << "could not get index" << endl;
                    }
                }
            }
            else if (key1 == "window")
            {
                cout << "key1 is window" << endl;
                if (element1.value().find("brightness") != element1.value().end())
                {
                    brightness = element1.value()["brightness"].get<int>() / (float)UCHAR_MAX;
                    cout << "brightness: " << brightness << endl;
                }
            }
            else if (key1 == "command")
            {
                cout << "key1 is command" << endl;
                if (element1.value() == "screenshot")
                {
                    cout << "screenshot" << endl;
                    receivedScreenshotCommand = true;
                }
            }
        }
    }
    catch (const websocketpp::lib::error_code &e)
    {
        std::cout << "Read failed because: " << e << "(" << e.message() << ")" << std::endl;
    }
}

void exitHandler(int s)
{
    receivedQuitSignal = true;
}