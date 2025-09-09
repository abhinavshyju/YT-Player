import { YouTubePlayer } from "./Youtube-Player";

const videoId = "M7lc1UVf-VE";
const containerId = "my-player-container";

const player = new YouTubePlayer(containerId, videoId, {
  onReady: () => {
    console.log("Player is ready!");
  },
  onStateChange: (e) => {},
});
