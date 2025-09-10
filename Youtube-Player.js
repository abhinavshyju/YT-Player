"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubePlayer = void 0;
var YouTubePlayer = /** @class */ (function () {
    function YouTubePlayer(containerId, videoId, options) {
        if (options === void 0) { options = {}; }
        this.player = null;
        this.isPlaying = false;
        this.firstPlay = true;
        this.currentTime = 0;
        this.totalTime = 0;
        this.hideControlsTimeout = null;
        this.timeTrackingFrameId = null;
        this.isNewVideoLoading = false;
        this.onReady = null;
        this.onStateChange = null;
        this.containerId = containerId;
        this.videoId = videoId;
        var parentElement = document.getElementById(this.containerId);
        if (!parentElement)
            throw new Error("Element with id \"".concat(this.containerId, "\" not found."));
        this.parent = parentElement;
        this.onReady = options.onReady || null;
        this.onStateChange = options.onStateChange || null;
        this.setupUI();
        this.loadYouTubeAPI();
    }
    YouTubePlayer.prototype.setupUI = function () {
        this.parent.innerHTML = "\n      <div class=\"Player\" id=\"Player-container\">\n        <div class=\"Player-container\">\n          <div class=\"Player-hover-container\" id=\"Player-hover-container\">\n            <div class=\"Player-control-container\">\n              <div class=\"Player-top-container\">\n                <button class=\"settings\" id=\"setting-btn\"></button>\n              </div>\n              <div class=\"Player-center-container\">\n                <button class=\"playOrpuase\" data-state=\"play\" id=\"play-pause-btn\"></button>\n              </div>\n              <div class=\"Player-bottom-container\">\n                <h1 class=\"time\" id=\"current-time\">00:00</h1>\n                <div class=\"progress\">\n                  <progress id=\"progress\" value=\"0\" min=\"0\"></progress>\n                </div>\n                <h1 class=\"time\" id=\"total-time\">00:00</h1>\n                <button class=\"fullscreen\" data-state=\"maximize\" id=\"fullscreen-btn\"></button>\n              </div>\n            </div>\n          </div>\n          <div id=\"YTP_Container-".concat(this.containerId, "\"></div>\n        </div>\n      </div>\n    ");
        this.playPauseBtn = this.parent.querySelector("#play-pause-btn");
        this.fullscreenBtn = this.parent.querySelector("#fullscreen-btn");
        this.container = this.parent.querySelector("#Player-container");
        this.progressBar = this.parent.querySelector("#progress");
        this.videoDurationText = this.parent.querySelector("#total-time");
        this.currentTimeText = this.parent.querySelector("#current-time");
        this.hoverContainer = this.parent.querySelector("#Player-hover-container");
    };
    YouTubePlayer.prototype.loadYouTubeAPI = function () {
        var _this = this;
        var _a;
        if ((_a = window.YT) === null || _a === void 0 ? void 0 : _a.Player) {
            this.initPlayer();
        }
        else {
            var tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
            window.onYouTubeIframeAPIReady = function () { return _this.initPlayer(); };
        }
    };
    YouTubePlayer.prototype.initPlayer = function () {
        this.updateHoverBackground();
        this.player = new YT.Player("YTP_Container-".concat(this.containerId), {
            videoId: this.videoId,
            playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                playsinline: 1,
                cc_load_policy: 0,
                rel: 0,
            },
            events: {
                onReady: this.onPlayerReady.bind(this),
                onStateChange: this.onPlayerStateChange.bind(this),
            },
        });
    };
    YouTubePlayer.prototype.onPlayerReady = function () {
        var _a;
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.pauseVideo();
        this.bindControls();
        this.startTimeTracking();
        this.setupHoverAutoHide();
        this.setupPinchZoomListener();
        this.onResize();
        if (this.onReady)
            this.onReady();
    };
    YouTubePlayer.prototype.onPlayerStateChange = function (e) {
        var _a;
        if ((e.data === YT.PlayerState.UNSTARTED ||
            e.data === YT.PlayerState.PLAYING) &&
            this.totalTime === 0) {
            this.totalTime = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.getDuration()) || 0;
            this.videoDurationText.innerText = this.formatTime(this.totalTime);
        }
        if (this.isNewVideoLoading && e.data === YT.PlayerState.CUED) {
            this.isNewVideoLoading = false;
            this.currentTimeText.innerText = this.formatTime(0);
            this.progressBar.value = 0;
        }
        if (e.data === YT.PlayerState.ENDED) {
            this.restartVideo();
            this.pause();
        }
        if (this.onStateChange)
            this.onStateChange(e);
    };
    YouTubePlayer.prototype.bindControls = function () {
        var _this = this;
        this.playPauseBtn.addEventListener("click", function () { return _this.togglePlay(); });
        this.fullscreenBtn.addEventListener("click", function () { return _this.toggleFullscreen(); });
        this.progressBar.addEventListener("click", function (e) {
            return _this.handleProgressClick(e);
        });
    };
    YouTubePlayer.prototype.startTimeTracking = function () {
        var _this = this;
        if (this.timeTrackingFrameId)
            cancelAnimationFrame(this.timeTrackingFrameId);
        var update = function () {
            if (_this.player && _this.totalTime > 0) {
                _this.currentTime = _this.player.getCurrentTime();
                _this.currentTimeText.innerText = _this.formatTime(_this.currentTime);
                _this.progressBar.value = _this.currentTime / _this.totalTime;
            }
            _this.timeTrackingFrameId = requestAnimationFrame(update);
        };
        update();
    };
    YouTubePlayer.prototype.togglePlay = function () {
        this.isPlaying ? this.pause() : this.play();
    };
    YouTubePlayer.prototype.toggleFullscreen = function () {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen();
            this.fullscreenBtn.setAttribute("data-state", "minimize");
        }
        else {
            document.exitFullscreen();
            this.fullscreenBtn.setAttribute("data-state", "maximize");
        }
    };
    YouTubePlayer.prototype.restartVideo = function () {
        var _a;
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.seekTo(0, true);
    };
    YouTubePlayer.prototype.handleProgressClick = function (e) {
        var _a;
        var rect = this.progressBar.getBoundingClientRect();
        var clickX = e.clientX - rect.left;
        var clickPercent = clickX / rect.width;
        var seekTime = this.totalTime * clickPercent;
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.seekTo(seekTime, true);
    };
    YouTubePlayer.prototype.setupHoverAutoHide = function () {
        var _this = this;
        var controlContainer = this.hoverContainer.querySelector(".Player-control-container");
        if (!controlContainer)
            return;
        var resetTimer = function () {
            controlContainer.classList.remove("no-hover");
            _this.container.classList.remove("no-hover");
            if (_this.hideControlsTimeout)
                clearTimeout(_this.hideControlsTimeout);
            _this.hideControlsTimeout = window.setTimeout(function () {
                controlContainer.classList.add("no-hover");
                _this.container.classList.add("no-hover");
            }, 2000);
        };
        resetTimer();
        this.container.addEventListener("mousemove", resetTimer);
    };
    YouTubePlayer.prototype.updateHoverBackground = function () {
        this.hoverContainer.style.backgroundImage = this.firstPlay
            ? "url(\"https://img.youtube.com/vi/".concat(this.videoId, "/maxresdefault.jpg\")")
            : "none";
    };
    YouTubePlayer.prototype.formatTime = function (time) {
        var hours = Math.floor(time / 3600);
        var minutes = Math.floor((time % 3600) / 60);
        var seconds = Math.floor(time % 60);
        if (hours > 0) {
            return "".concat(this.pad(hours), ":").concat(this.pad(minutes), ":").concat(this.pad(seconds));
        }
        else {
            return "".concat(this.pad(minutes), ":").concat(this.pad(seconds));
        }
    };
    YouTubePlayer.prototype.pad = function (value) {
        return value < 10 ? "0".concat(value) : "".concat(value);
    };
    YouTubePlayer.prototype.setupPinchZoomListener = function () {
        var _this = this;
        var initialDistance = 0;
        var isZooming = false;
        var getDistance = function (touches) {
            var dx = touches[1].clientX - touches[0].clientX;
            var dy = touches[1].clientY - touches[0].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };
        this.container.addEventListener("touchstart", function (e) {
            if (e.touches.length === 2) {
                initialDistance = getDistance(e.touches);
                isZooming = true;
            }
        });
        this.container.addEventListener("touchmove", function (e) {
            if (isZooming && e.touches.length === 2) {
                var currentDistance = getDistance(e.touches);
                var scale = currentDistance / initialDistance;
                scale = Math.min(Math.max(scale, 1), 3);
                if (document.fullscreenElement) {
                    var iframe = _this.container.querySelector("iframe");
                    if (iframe) {
                        iframe.style.transform = "scale(".concat(scale, ")");
                        iframe.style.transition = "transform 0.1s ease-out";
                    }
                }
            }
        });
    };
    YouTubePlayer.prototype.resetScale = function () {
        var iframe = this.container.querySelector("iframe");
        if (iframe) {
            iframe.style.transition = "transform 0.3s ease";
            iframe.style.transform = "scale(1)";
        }
    };
    YouTubePlayer.prototype.onResize = function () {
        window.addEventListener("resize", this.resetScale);
    };
    YouTubePlayer.prototype.play = function () {
        var _a;
        if (this.firstPlay) {
            this.firstPlay = false;
            this.updateHoverBackground();
        }
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.playVideo();
        this.playPauseBtn.setAttribute("data-state", "pause");
        this.isPlaying = true;
    };
    YouTubePlayer.prototype.pause = function () {
        var _a;
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.pauseVideo();
        this.playPauseBtn.setAttribute("data-state", "play");
        this.isPlaying = false;
    };
    YouTubePlayer.prototype.changeVideo = function (videoId) {
        var _a, _b;
        if (this.videoId === videoId)
            return;
        this.videoId = videoId;
        this.firstPlay = true;
        this.isNewVideoLoading = true;
        this.totalTime = 0;
        this.videoDurationText.innerText = "00:00";
        this.currentTimeText.innerText = "00:00";
        this.progressBar.value = 0;
        this.updateHoverBackground();
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.loadVideoById(videoId);
        (_b = this.player) === null || _b === void 0 ? void 0 : _b.pauseVideo();
    };
    YouTubePlayer.prototype.destroy = function () {
        var _a;
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.destroy();
        this.parent.innerHTML = "";
        window.removeEventListener("resize", this.resetScale);
        if (this.timeTrackingFrameId)
            cancelAnimationFrame(this.timeTrackingFrameId);
        if (this.hideControlsTimeout)
            clearTimeout(this.hideControlsTimeout);
    };
    return YouTubePlayer;
}());
exports.YouTubePlayer = YouTubePlayer;
