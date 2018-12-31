#include <vector>

#include <grabber/ColorRgb.h>
#include <serial/serial.h>

class DefaultDevice
{
  public:
    DefaultDevice(const DefaultDevice &obj) : _rs232Port(), _deviceName(obj._deviceName), _baudRate(obj._baudRate), _ledBuffer(0){};
    DefaultDevice(const std::string &outputDevice, const unsigned baudRate) : _deviceName(outputDevice),
                                                                              _baudRate(baudRate),
                                                                              _rs232Port(),
                                                                              _ledBuffer(0){};
    ~DefaultDevice()
    {
        if (_rs232Port.isOpen())
        {
            _rs232Port.close();
        }
    };
    int write(const std::vector<ColorRgb> &ledValues)
    {
        if (_ledBuffer.size() == 0)
        {
            _ledBuffer.resize(6 + 3 * ledValues.size());
            _ledBuffer[0] = 'A';
            _ledBuffer[1] = 'd';
            _ledBuffer[2] = 'a';
            _ledBuffer[3] = ((ledValues.size() - 1) >> 8) & 0xFF; // LED count high byte
            _ledBuffer[4] = (ledValues.size() - 1) & 0xFF;        // LED count low byte
            _ledBuffer[5] = _ledBuffer[3] ^ _ledBuffer[4] ^ 0x55; // Checksum
        }

        // restart the timer
        // _timer.start();

        // write data
        memcpy(6 + _ledBuffer.data(), ledValues.data(), ledValues.size() * 3);
        return writeBytes(_ledBuffer.size(), _ledBuffer.data());
    }
    int open()
    {
        try
        {
            std::cout << "Opening UART: " << _deviceName << " at " << _baudRate << "Bd" << std::endl;
            _rs232Port.setPort(_deviceName);
            _rs232Port.setBaudrate(_baudRate);
            _rs232Port.open();

            // if (_delayAfterConnect_ms > 0)
            // {
            //     _blockedForDelay = true;
            //     QTimer::singleShot(_delayAfterConnect_ms, this, SLOT(unblockAfterDelay()));
            //     std::cout << "Device blocked for " << _delayAfterConnect_ms << " ms" << std::endl;
            // }
        }
        catch (const std::exception &e)
        {
            std::cerr << "Unable to open RS232 device (" << e.what() << ")" << std::endl;
            return -1;
        }

        return 0;
    }
    int writeBytes(const unsigned size, const uint8_t *data)
    {
        // if (_blockedForDelay)
        // {
        //     return 0;
        // }

        // if (!_rs232Port.isOpen())
        {
            // try to reopen
            int status = open();
            if (status == -1)
            {
                // Try again in 3 seconds
                // int seconds = 3000;
                // _blockedForDelay = true;
                // QTimer::singleShot(seconds, this, SLOT(unblockAfterDelay()));
                // std::cout << "Device blocked for " << seconds << " ms" << std::endl;
                std::cout << "Device blocked" << std::endl;
            }
            return status;
        }

        //	for (int i = 0; i < 20; ++i)
        //		std::cout << std::hex << (int)data[i] << " ";
        //	std::cout << std::endl;

        // try
        {
            // _rs232Port.flushOutput();
            // _rs232Port.write(data, size);
            // _rs232Port.flush();
        }
        // catch (const serial::SerialException &serialExc)
        {
            // TODO[TvdZ]: Maybe we should limit the frequency of this error report somehow
            // std::cerr << "Serial exception caught while writing to device: " << serialExc.what() << std::endl;
            // std::cout << "Attempting to re-open the device." << std::endl;

            // First make sure the device is properly closed
            try
            {
                // _rs232Port.close();
            }
            catch (const std::exception &e)
            {
            }

            // Attempt to open the device and write the data
            try
            {
                // _rs232Port.open();
                // _rs232Port.write(data, size);
                // _rs232Port.flush();
            }
            catch (const std::exception &e)
            {
                // We failed again, this not good, do nothing maybe in the next loop we have more success
            }
        }
        // catch (const std::exception &e)
        {
            // std::cerr << "Unable to write to RS232 device (" << e.what() << ")" << std::endl;
            // return -1;
        }

        return 0;
    };
    const std::string _deviceName;
    const int _baudRate;
    serial::Serial _rs232Port;

  protected:
    //
    std::vector<uint8_t> _ledBuffer;

  private:
    //
};