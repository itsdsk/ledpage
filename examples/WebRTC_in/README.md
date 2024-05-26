# WebRTC Example

This example contains a website with graphics that follow a person detected in the webcam of a nearby laptop. The website runs in 2 places for this to work. On the laptop, it opens the webcam then runs Tensorflow detection on the video stream. On the Pi, it listens for a connection from the other instance using PeerJS, a wrapper for WebRTC. Once the connection is made, the laptop streams body position data directly to the Pi in real-time.

![Video of WebRTC demo](/examples/media/webrtc_in.webp "Cover image")

## Files

* [public/](public) - website
