import React, { useRef, useState, useEffect } from "react";
import { FaPlay, FaPause, FaStop, FaForward, FaBackward } from "react-icons/fa";
import Track_1 from "./assets/Track_1.mp3";
import Track_2 from "./assets/Track_2.mp3";
import Track_3 from "./assets/Track_3.mp3";
import test from "./assets/test.png";

const MusicPlayer = () => {
  const audioRef = useRef(null); // reference for the audio element
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(0);

  const playlist = [
    { title: "Track 1", src: Track_1, image: test },
    { title: "Track 2", src: Track_2, image: test },
    { title: "Track 3", src: Track_3, image: test },
  ];

  useEffect(() => {
    if (!audioContextRef.current && audioRef.current) {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // Set the FFT size for frequency analysis
      analyserRef.current = analyser;

      const audio = audioRef.current;
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      sourceRef.current = source;

      // Start visualizing the audio on the canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Function to draw the visualizer
      const draw = () => {
        requestAnimationFrame(draw);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        // Loop through the frequency data and draw the bars
        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];

          ctx.fillStyle = "blue"; // Set color to blue
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

          x += barWidth + 1; // Spacing between bars
        }
      };

      draw(); // Start drawing the visualizer
    }
  }, []); // Runs once after the component mounts

  useEffect(() => {
    const audio = audioRef.current;

    // Event listener for audio ended
    const handleAudioEnd = () => {
      setIsPlaying(false); // Reset the play/pause state
    };

    if (audio) {
      audio.addEventListener("ended", handleAudioEnd);
    }

    // Cleanup the event listener
    return () => {
      if (audio) {
        audio.removeEventListener("ended", handleAudioEnd);
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      audioContextRef.current.suspend();
    } else {
      audioRef.current.play();
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleTrackChange = (index) => {
    const audio = audioRef.current;

    // Save the current playback state
    const wasPlaying = !audio.paused;

    setCurrentTrack(index);

    // Update the audio source
    audio.src = playlist[index].src;

    // Load the new audio track
    audio.load();

    // Apply the previous playback state to the new track
    if (wasPlaying) {
      audio.onloadeddata = () => {
        audio.play();
        setIsPlaying(true);
      };
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (event) => {
    const newTime = (event.target.value / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleNextTrack = () => {
    const nextIndex = (currentTrack + 1) % playlist.length; // Loop back to start if at the end
    handleTrackChange(nextIndex);
  };

  const handlePreviousTrack = () => {
    const prevIndex = (currentTrack - 1 + playlist.length) % playlist.length; // Loop back to the end if at the start
    handleTrackChange(prevIndex);
  };

  return (
    <div
      className="flex max-w-lg mx-auto bg-white rounded-xl shadow-md space-x-6 p-6"
      style={{ backgroundImage: `url(${test})`, backgroundSize: "cover" }}
    >
      {/* Playlist on the Left */}
      {/* Music Player on the Right */}
      <div className="w-2/3 text-center flex flex-col items-center justify-center space-y-4">
        <audio
          ref={audioRef}
          src={playlist[currentTrack].src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
        <div>
          <h1 className="text-2xl font-bold text-white">
            {playlist[currentTrack].title}
          </h1>
          <img
            src={playlist[currentTrack].image}
            alt="Album Art"
            className="w-48 h-48 mx-auto rounded-md shadow-md"
          />
        </div>
        <div className="flex justify-center space-x-4 items-center">
          <button
            onClick={() => handlePreviousTrack()}
            className="text-gray-500 hover:text-gray-700"
          >
            {/* Previous Button */}
            <FaBackward size={32} />
          </button>
          <button
            onClick={handlePlayPause}
            className="text-blue-500 hover:text-blue-700"
          >
            {isPlaying ? <FaPause size={32} /> : <FaPlay size={32} />}
          </button>
          <button
            onClick={handleStop}
            className="text-red-500 hover:text-red-700"
          >
            <FaStop size={32} />
          </button>
          <button
            onClick={() => handleNextTrack()}
            className="text-gray-500 hover:text-gray-700"
          >
            {/* Next Button */}
            <FaForward size={32} />
          </button>
        </div>
        <div>
          <input
            type="range"
            min="0"
            max="100"
            value={(currentTime / duration) * 100 || 0}
            onChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-white">
            <span>
              {Math.floor(currentTime / 60)}:
              {String(Math.floor(currentTime % 60)).padStart(2, "0")}
            </span>
            <span>
              {Math.floor(duration / 60)}:
              {String(Math.floor(duration % 60)).padStart(2, "0")}
            </span>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width="600"
          height="200"
          className="w-full mx-auto"
        ></canvas>
      </div>
      <div className="w-1/2 bg-red-300 text-white p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-4">Playlist</h2>
        <div className=" max-h-96  overflow-y-auto custom-scrollbar">
          <div className="px-2 space-y-2">
            {playlist.map((track, index) => (
              <button
                key={index}
                onClick={() => handleTrackChange(index)}
                className={`${
                  index === currentTrack
                    ? "bg-blue-500 text-white"
                    : "bg-gray-600 text-gray-200"
                } hover:bg-gray-700 font-bold py-2 px-4 w-full text-left rounded`}
              >
                {track.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
