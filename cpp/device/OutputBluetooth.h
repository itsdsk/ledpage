#pragma once

#include <device/Output.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/socket.h>
#include <bluetooth/bluetooth.h>
#include <bluetooth/rfcomm.h>
#include <thirdparty/json/single_include/nlohmann/json.hpp>
using json = nlohmann::json;

class OutputBluetooth : public Output
{
public:
    OutputBluetooth(const json &properties)
    {
        // check properties object contains MAC address of bluetooth device
        if (properties.contains("MAC"))
        {
            MAC_addr = properties["MAC"];
            std::cout << "Using Bluetooth MAC address " << MAC_addr << std::endl;
        }
        else
        {
            std::cout << "No MAC address for bluetooth device specified in properties" << std::endl;
        }
        struct sockaddr_rc addr = {0};
        int status;
        // allocate socket
        bluetooth_sock = socket(AF_BLUETOOTH, SOCK_STREAM, BTPROTO_RFCOMM);
        // set the connection parameters (who to connect to)
        addr.rc_family = AF_BLUETOOTH;
        addr.rc_channel = (uint8_t)1;
        str2ba(MAC_addr.c_str(), &addr.rc_bdaddr);

        // connect to server
        status = connect(bluetooth_sock, (struct sockaddr *)&addr, sizeof(addr));

        if (status == 0) {
            std::cout << "Success opening Bluetooth device" << std::endl;
            connection_status = true;
        } else {
            perror("Error opening bluetooth");
        }
    };
    int write(const std::vector<ColorRgb> &ledValues)
    {
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
        // check whether to reconnect to bluetooth
        if (num_connection_errors % max_connection_errors == max_connection_errors - 1) {
            std::cout << "Reconnecting to bluetooth: " << MAC_addr << std::endl;
            // attempt to reconnect to bluetooth
            struct sockaddr_rc addr = {0};
            int status;
            // allocate socket
            bluetooth_sock = socket(AF_BLUETOOTH, SOCK_STREAM, BTPROTO_RFCOMM);
            // set the connection parameters (who to connect to)
            addr.rc_family = AF_BLUETOOTH;
            addr.rc_channel = (uint8_t)1;
            str2ba(MAC_addr.c_str(), &addr.rc_bdaddr);
            // connect to server
            status = connect(bluetooth_sock, (struct sockaddr *)&addr, sizeof(addr));
            if (status == 0) {
                std::cout << "Success opening Bluetooth device" << std::endl;
                connection_status = true;
            } else {
                perror("Error opening bluetooth");
            }
        }
        // copy led data to mesage
        memcpy(6 + (char*)_ledBuffer.data(), ledValues.data(), ledValues.size() * 3);
        // write data
        if (connection_status)
        {
            int status = ::write(bluetooth_sock, (char*)_ledBuffer.c_str(), _ledBuffer.length());
            if (status < 0)
            {
                if (num_connection_errors < 5)
                    perror("Bluetooth TX Error");
                // increment counter
                num_connection_errors++;
            }
            else
            {
                // bluetooth write successful, reset counter
                num_connection_errors = 0;
            }
            
        } else {
            // no bluetooth connection, increment counter
            num_connection_errors++;
        }
        // delay loop (fixes errors in covid lamp)
        usleep(16666);
        // continue
        return 0;
    }
    virtual ~OutputBluetooth()
    {
        // close the bus
        close(bluetooth_sock);
        std::cout << "Closed Bluetooth" << std::endl;
    };
    // data block for arduino
    std::string _ledBuffer = "";
    int bluetooth_sock = -1;
    bool connection_status = false;
    std::string MAC_addr = "00:00:00:00:00:00";
    unsigned num_connection_errors = 0;
    unsigned max_connection_errors = 600;
};