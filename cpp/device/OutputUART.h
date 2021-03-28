#pragma once

#include <device/Output.h>
#include <stdio.h>
#include <unistd.h>  //Used for UART
#include <fcntl.h>   //Used for UART
#include <termios.h> //Used for UART
#include <thirdparty/json/single_include/nlohmann/json.hpp>
using json = nlohmann::json;

class OutputUART : public Output
{
public:
    OutputUART(const json &properties)
    {
        // reference: https://raspberry-projects.com/pi/programming-in-c/uart-serial-port/using-the-uart
        
        //-------------------------
        //----- SETUP USART 0 -----
        //-------------------------
        //At bootup, pins 8 and 10 are already set to UART0_TXD, UART0_RXD (ie the alt0 function) respectively

        //OPEN THE UART
        //The flags (defined in fcntl.h):
        //	Access modes (use 1 of these):
        //		O_RDONLY - Open for reading only.
        //		O_RDWR - Open for reading and writing.
        //		O_WRONLY - Open for writing only.
        //
        //	O_NDELAY / O_NONBLOCK (same function) - Enables nonblocking mode. When set read requests on the file can return immediately with a failure status
        //											if there is no input immediately available (instead of blocking). Likewise, write requests can also return
        //											immediately with a failure status if the output can't be written immediately.
        //
        //	O_NOCTTY - When set and path identifies a terminal device, open() shall not cause the terminal device to become the controlling terminal for the process.
        uart0_filestream = open("/dev/ttyS0", O_WRONLY | O_NOCTTY | O_NDELAY); //Open in non blocking read/write mode
        if (uart0_filestream == -1)
        {
            //ERROR - CAN'T OPEN SERIAL PORT
            printf("Error - Unable to open UART.  Ensure it is not in use by another application\n");
        }

        //CONFIGURE THE UART
        //The flags (defined in /usr/include/termios.h - see http://pubs.opengroup.org/onlinepubs/007908799/xsh/termios.h.html):
        //	Baud rate:- B1200, B2400, B4800, B9600, B19200, B38400, B57600, B115200, B230400, B460800, B500000, B576000, B921600, B1000000, B1152000, B1500000, B2000000, B2500000, B3000000, B3500000, B4000000
        //	CSIZE:- CS5, CS6, CS7, CS8
        //	CLOCAL - Ignore modem status lines
        //	CREAD - Enable receiver
        //	IGNPAR = Ignore characters with parity errors
        //	ICRNL - Map CR to NL on input (Use for ASCII comms where you want to auto correct end of line characters - don't use for bianry comms!)
        //	PARENB - Parity enable
        //	PARODD - Odd parity (else even)
        struct termios options;
        tcgetattr(uart0_filestream, &options);
        options.c_cflag = B9600 | CS8 | CLOCAL; //<Set baud rate
        options.c_iflag = IGNPAR;
        options.c_oflag = 0;
        options.c_lflag = 0;
        tcflush(uart0_filestream, TCIFLUSH);
        tcsetattr(uart0_filestream, TCSANOW, &options);
        std::cout << "Opened UART" << std::endl;
    };
    int write(std::vector<ColorRgb> &ledValues,  float &brightness)
    {
        // apply brightness
        setBrightness(ledValues, brightness);
        // check if output buffer object is initialised
        if (_ledBuffer.length() == 0)
        {
            // set output buffer size
            _ledBuffer.resize(6 + 3 * ledValues.size());
            // set header
            _ledBuffer[0] = 'A';
            _ledBuffer[1] = 'd';
            _ledBuffer[2] = 'a';
            _ledBuffer[3] = ((ledValues.size() - 1) >> 8) & 0xFF; // LED count high byte
            _ledBuffer[4] = (ledValues.size() - 1) & 0xFF;        // LED count low byte
            _ledBuffer[5] = _ledBuffer[3] ^ _ledBuffer[4] ^ 0x55; // Checksum
        }
        // copy led data to mesage
        memcpy(6 + (char*)_ledBuffer.data(), ledValues.data(), ledValues.size() * 3);
        // write data
        if (uart0_filestream != -1)
        {
            int count = ::write(uart0_filestream, (char*)_ledBuffer.c_str(), _ledBuffer.length());
            if (count < 0)
            {
                //std::cout << "UART TX error\n" << std::endl;
            }
            else
            {
                //std::cout << "sending out of uart\n" << std::endl; 
            }
            
        }
        return 0;
    }
    virtual ~OutputUART()
    {
        // close the UART bus
        close(uart0_filestream);
        std::cout << "Closed UART" << std::endl;
    };
    // data block for arduino
    std::string _ledBuffer = "";
    int uart0_filestream = -1;
};