interface YouTubePlayerOptions {
  onReady?: () => void;
  onStateChange?: (e: YT.OnStateChangeEvent) => void;
}

export class YouTubePlayer {
  private player: YT.Player | null = null;
  private readonly videoId: string;
  private readonly containerId: string;
  private isPlaying = false;
  private firstPlay = true;
  private currentTime = 0;
  private totalTime = 0;
  private parent: HTMLElement;
  private playPauseBtn!: HTMLButtonElement;
  private fullscreenBtn!: HTMLButtonElement;
  private container!: HTMLDivElement;
  private progressBar!: HTMLProgressElement;
  private videoDurationText!: HTMLElement;
  private currentTimeText!: HTMLElement;
  private hoverContainer!: HTMLDivElement;
  private hideControlsTimeout: number | undefined;

  public onReady: (() => void) | null = null;
  public onStateChange: ((e: YT.OnStateChangeEvent) => void) | null = null;

  constructor(
    containerId: string,
    videoId: string,
    options: YouTubePlayerOptions = {}
  ) {
    this.containerId = containerId;
    this.videoId = videoId;
    const parentElement = document.getElementById(this.containerId);
    if (!parentElement) {
      throw new Error(`Element with id "${this.containerId}" not found.`);
    }
    this.parent = parentElement;

    this.onReady = options.onReady || null;
    this.onStateChange = options.onStateChange || null;

    this.setupUI();
    this.loadYouTubeAPI();
  }

  private setupUI(): void {
    this.parent.innerHTML = `
      <div class="Player" id="Player-container">
        <div class="Player-container">
          <div class="Player-hover-container" id="Player-hover-container">
            <div class="Player-control-container">
              <div class="Player-top-container">
                <button class="settings" id="setting-btn"></button>
              </div>
              <div class="Player-center-container">
                <button class="playOrpuase" data-state="play" id="play-pause-btn"></button>
              </div>
              <div class="Player-bottom-container">
                <h1 class="time" id="current-time">00:00</h1>
                <div class="progress">
                  <progress id="progress" value="0" min="0"></progress>
                </div>
                <h1 class="time" id="total-time">00:00</h1>
                <button class="fullscreen" data-state="maximize" id="fullscreen-btn"></button>
              </div>
            </div>
          </div>
          <div id="YTP_Container-${this.containerId}"></div>
        </div>
      </div>
    `;

    this.playPauseBtn = this.parent.querySelector("#play-pause-btn")!;
    this.fullscreenBtn = this.parent.querySelector("#fullscreen-btn")!;
    this.container = this.parent.querySelector("#Player-container")!;
    this.progressBar = this.parent.querySelector("#progress")!;
    this.videoDurationText = this.parent.querySelector("#total-time")!;
    this.currentTimeText = this.parent.querySelector("#current-time")!;
    this.hoverContainer = this.parent.querySelector("#Player-hover-container")!;
  }

  private loadYouTubeAPI(): void {
    if (window.YT?.Player) {
      this.initPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = () => this.initPlayer();
    }
  }

  private initPlayer(): void {
    this.updateHoverBackground();
    this.player = new YT.Player(`YTP_Container-${this.containerId}`, {
      videoId: this.videoId,
      playerVars: {
        autoplay: 1,
        cc_load_policy: 0,
        color: "white",
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        loop: 0,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: this.onPlayerReady.bind(this),
        onStateChange: this.onPlayerStateChange.bind(this),
      },
    });
  }

  private onPlayerReady(): void {
    this.player?.pauseVideo();
    this.totalTime = this.player!.getDuration();
    this.videoDurationText.innerText = this.formatTime(this.totalTime);

    this.bindControls();
    this.startTimeTracking();
    this.setupHoverAutoHide();
    this.setupPinchZoomListener();
    this.onResize();

    if (this.onReady) {
      this.onReady();
    }
  }

  private onPlayerStateChange(e: YT.OnStateChangeEvent): void {
    if (e.data === YT.PlayerState.ENDED) {
      this.restartVideo();
      this.pause();
    }

    if (this.onStateChange) {
      this.onStateChange(e);
    }
  }

  private bindControls(): void {
    this.playPauseBtn.addEventListener("click", this.togglePlay.bind(this));
    this.fullscreenBtn.addEventListener(
      "click",
      this.toggleFullscreen.bind(this)
    );
    this.progressBar.addEventListener("click", (e) =>
      this.handleProgressClick(e as MouseEvent)
    );
  }

  private startTimeTracking(): void {
    const update = () => {
      if (this.player) {
        this.currentTime = this.player.getCurrentTime();
        this.currentTimeText.innerText = this.formatTime(this.currentTime);
        this.progressBar.value = this.currentTime / this.totalTime;
      }
      requestAnimationFrame(update);
    };
    update();
  }

  private togglePlay(): void {
    this.isPlaying ? this.pause() : this.play();
  }

  public play(): void {
    if (this.firstPlay) {
      this.firstPlay = false;
      this.updateHoverBackground();
    }
    this.player?.playVideo();
    this.playPauseBtn.setAttribute("data-state", "pause");
    this.isPlaying = true;
  }

  public pause(): void {
    this.player?.pauseVideo();
    this.playPauseBtn.setAttribute("data-state", "play");
    this.isPlaying = false;
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen();
      this.fullscreenBtn.setAttribute("data-state", "minimize");
    } else {
      document.exitFullscreen();
      this.fullscreenBtn.setAttribute("data-state", "maximize");
    }
  }

  private restartVideo(): void {
    this.player?.seekTo(0, true);
  }

  private handleProgressClick(e: MouseEvent): void {
    const rect = this.progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const seekTime = this.totalTime * clickPercent;

    this.player?.seekTo(seekTime, true);
  }

  private setupHoverAutoHide(): void {
    const controlContainer = this.hoverContainer.querySelector(
      ".Player-control-container"
    );
    if (!controlContainer) return;

    const resetTimer = () => {
      controlContainer.classList.remove("no-hover");
      this.container.classList.remove("no-hover");
      if (this.hideControlsTimeout) clearTimeout(this.hideControlsTimeout);
      this.hideControlsTimeout = window.setTimeout(() => {
        controlContainer.classList.add("no-hover");
        this.container.classList.add("no-hover");
      }, 2000);
    };
    resetTimer();
    this.container.addEventListener("mousemove", resetTimer);
  }

  private updateHoverBackground(): void {
    this.hoverContainer.style.backgroundImage = this.firstPlay
      ? `url("https://img.youtube.com/vi/${this.videoId}/maxresdefault.jpg")`
      : "none";
  }

  private formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  private pad(value: number): string {
    return value.toString().padStart(2, "0");
  }

  private setupPinchZoomListener(): void {
    let initialDistance = 0;
    let isZooming = false;

    const getDistance = (touches: TouchList): number => {
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    this.container.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches);
        isZooming = true;
      }
    });

    this.container.addEventListener("touchmove", (e) => {
      if (isZooming && e.touches.length === 2) {
        const currentDistance = getDistance(e.touches);
        let scale = currentDistance / initialDistance;

        scale = Math.min(Math.max(scale, 1), 3);

        if (document.fullscreenElement) {
          const iframe = this.container.querySelector("iframe");
          if (iframe) {
            iframe.style.transform = `scale(${scale})`;
            iframe.style.transition = "transform 0.1s ease-out";
          }
        }
      }
    });
  }

  private resetScale(): void {
    const iframe = this.container.querySelector("iframe");
    if (iframe) {
      iframe.style.transition = "transform 0.3s ease";
      iframe.style.transform = "scale(1)";
    }
  }

  private onResize(): void {
    window.addEventListener("resize", this.resetScale.bind(this));
  }

  public destroy(): void {
    this.player?.destroy();
    this.parent.innerHTML = "";
    window.removeEventListener("resize", this.resetScale.bind(this));
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout);
    }
  }
}
