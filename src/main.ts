import { YouTubePlayer } from "./Youtube-Player";

const videoId = "bgJ_1WuhUig";
const containerId = "my-player-container";

const player = new YouTubePlayer(containerId, videoId, {
  onReady: () => {
    console.log("Player is ready!");
  },
  onStateChange: (e) => {
    console.log(e.data);
  },
});

document.getElementById("video-id-update")?.addEventListener("click", () => {
  const newVideoIdEle = document.getElementById("video-id") as HTMLInputElement;
  const newVideoId = newVideoIdEle.value;
  if (newVideoId == "") {
    return;
  }
  player.changeVideo(newVideoId);
});

document.getElementById("video-play")?.addEventListener("click", () => {
  player.play();
});
document.getElementById("video-pause")?.addEventListener("click", () => {
  player.pause();
});
