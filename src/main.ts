import { YouTubePlayer } from "./Youtube-Player";

const videoId = "wI98oxUbWSY";
const containerId = "my-player-container";

// const player = new YouTubePlayer(containerId, videoId, {
new YouTubePlayer(containerId, videoId, {
  onReady: () => {
    console.log("Player is ready!");
  },
  // onStateChange: (e) => {},
});
