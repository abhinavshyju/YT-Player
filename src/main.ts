import { YouTubePlayer } from "./Youtube-Player";

// const videoId = "wI98oxUbWSY";
const videoId = "1qMNtY5IFac";
const containerId = "my-player-container";

const player = new YouTubePlayer(containerId, videoId, {
  onReady: () => {
    console.log("Player is ready!");
  },
  // onStateChange: (e) => {},
});

document.getElementById("video-id-update")?.addEventListener("click", () => {
  const newVideoId = document.getElementById("video-id") as HTMLInputElement;
  player.changeVideo(newVideoId.value);
});

document.getElementById("video-play")?.addEventListener("click", () => {
  player.play();
});
document.getElementById("video-pause")?.addEventListener("click", () => {
  player.pause();
});
