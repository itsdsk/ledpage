#pragma once

#include <device/Output.h>
#include <stdio.h>
#include <unistd.h>  //Used for UART
#include <fcntl.h>   //Used for UART
#include <termios.h> //Used for UART

class OutputUART : public Output
{
public:
    OutputUART()
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
    int write(const std::vector<ColorRgb> &ledValues)
    {
        // check output buffer object is initialised
        if (_ledBuffer.size() == 0)
        {
            // set output buffer size
            UARTFrameLength = (startFrameLength + ledValues.size() + endFrameLength) * bytesPerLED;
            _ledBuffer.resize(UARTFrameLength);
            // init the start frame
            for (int i = 0; i < startFrameLength * bytesPerLED; i++)
            {
                _ledBuffer[i] = 0;
            }
            // init the driver LED / voltage boost pixel
            for (int i = startFrameLength * bytesPerLED; i < (startFrameLength)*bytesPerLED; i += bytesPerLED)
            {
                _ledBuffer[i] = 255;
                _ledBuffer[i + 1] = 0;
                _ledBuffer[i + 2] = 0;
                _ledBuffer[i + 3] = 0;
            }
            // init the end frame
            for (int ledIndex = UARTFrameLength - (endFrameLength * bytesPerLED); ledIndex < UARTFrameLength; ledIndex += bytesPerLED)
            {
                _ledBuffer[ledIndex] = 255;
                _ledBuffer[ledIndex + 1] = 255;
                _ledBuffer[ledIndex + 2] = 255;
                _ledBuffer[ledIndex + 3] = 255;
            }
        }
        // insert colours into output buffer
        for (int ledIndex = 0; ledIndex < ledValues.size(); ledIndex++)
        {
            int bufferIndex = (startFrameLength + ledIndex) * bytesPerLED;
            _ledBuffer[bufferIndex] = 255;
            _ledBuffer[bufferIndex + 1] = ledValues[ledIndex].red;
            _ledBuffer[bufferIndex + 2] = ledValues[ledIndex].green;
            _ledBuffer[bufferIndex + 3] = ledValues[ledIndex].blue;
        }
        // send to LEDs
        //----- TX BYTES -----
        unsigned char tx_buffer[20];
        unsigned char *p_tx_buffer;

        p_tx_buffer = &tx_buffer[0];
        *p_tx_buffer++ = 'H';
        *p_tx_buffer++ = 'e';
        *p_tx_buffer++ = 'l';
        *p_tx_buffer++ = 'l';
        *p_tx_buffer++ = 'o';

        if (uart0_filestream != -1)
        {
            int count = ::write(uart0_filestream, &tx_buffer[0], (p_tx_buffer - &tx_buffer[0])); //Filestream, bytes to write, number of bytes to write
            if (count < 0)
            {
                printf("UART TX error\n");
            }
            std::cout << "sending out of uart" << std::endl;
        }
        else
        {
            std::cout << "not sending out of uart" << std::endl;
        }
        return 0;
    }
    virtual ~OutputUART()
    {
        // close the UART bus
        close(uart0_filestream);
        std::cout << "Closed UART" << std::endl;
    };
    std::vector<char> _ledBuffer;

    // setup data block for LEDs
    static const uint8_t bytesPerLED = 4;
    static const int16_t endFrameLength = 15;  //round( (numOfLEDs/2)/8 );
    static const int16_t startFrameLength = 1; // n * bytesPerLED
    int16_t UARTFrameLength = 0;
    int uart0_filestream = -1;
};