(() => {
  const config = {
    enabledViews: ["fs", "npv"], // "fs" Full screen, "npv" Now Playing View
  };
  const LOGGING = true;
  const importScript = (url) => {
    let script = document.createElement("script");
    script.src = url;
    script.setAttribute("crossOrigin", "");
    document.body.appendChild(script);
  };
  // get protobuf to encode requests
  importScript(
    "//cdn.rawgit.com/dcodeIO/protobuf.js/v6.10.2/dist/light/protobuf.min.js"
  );
  const onLoad = async () => {
    const log = LOGGING ? console.log : () => {};

    // load protobuf format for request
    class Protobuf {
      static root = protobuf.Root.fromJSON({
        nested: {
          com: {
            nested: {
              spotify: {
                nested: {
                  canvazcache: {
                    options: {
                      optimize_for: "CODE_SIZE",
                      java_package: "com.spotify.canvaz",
                    },
                    nested: {
                      Artist: {
                        fields: {
                          uri: { type: "string", id: 1 },
                          name: { type: "string", id: 2 },
                          avatar: { type: "string", id: 3 },
                        },
                      },
                      EntityCanvazResponse: {
                        fields: {
                          canvases: { rule: "repeated", type: "Canvaz", id: 1 },
                          ttlInSeconds: { type: "int64", id: 2 },
                        },
                        nested: {
                          Canvaz: {
                            fields: {
                              id: { type: "string", id: 1 },
                              url: { type: "string", id: 2 },
                              fileId: { type: "string", id: 3 },
                              type: { type: "canvaz.Type", id: 4 },
                              entityUri: { type: "string", id: 5 },
                              artist: { type: "Artist", id: 6 },
                              explicit: { type: "bool", id: 7 },
                              uploadedBy: { type: "string", id: 8 },
                              etag: { type: "string", id: 9 },
                              canvasUri: { type: "string", id: 11 },
                            },
                          },
                        },
                      },
                      EntityCanvazRequest: {
                        fields: {
                          entities: { rule: "repeated", type: "Entity", id: 1 },
                        },
                        nested: {
                          Entity: {
                            fields: {
                              entityUri: { type: "string", id: 1 },
                              etag: { type: "string", id: 2 },
                            },
                          },
                        },
                      },
                    },
                  },
                  canvaz: {
                    options: {
                      optimize_for: "CODE_SIZE",
                      java_package: "com.spotify.canvaz",
                    },
                    nested: {
                      Type: {
                        values: {
                          IMAGE: 0,
                          VIDEO: 1,
                          VIDEO_LOOPING: 2,
                          VIDEO_LOOPING_RANDOM: 3,
                          GIF: 4,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      static EntityCanvazRequest = this.root.lookupType(
        "com.spotify.canvazcache.EntityCanvazRequest"
      );

      static EntityCanvazResponse = this.root.lookupType(
        "com.spotify.canvazcache.EntityCanvazResponse"
      );

      static encodeRequest(track) {
        log("[Canvas/Protobuf] Encoding request for track:", track);
        return this.EntityCanvazRequest.encode(
          this.EntityCanvazRequest.create({
            entities: [{ entityUri: track }],
          })
        ).finish();
      }

      static decodeResponse(buffer) {
        let res;
        try {
          res = this.EntityCanvazResponse.decode(buffer);
          log("[Canvas/Protobuf] Decoded canvas request:");
          log(res);
        } catch (error) {
          log("[Canvas/Protobuf] Error decoding canvas request response body!");
          log(error);
          try {
            let json = JSON.parse(new TextDecoder().decode(buffer));
            log("[Canvas/Protobuf] Got JSON response:");
            log(json);
          } catch (error2) {}
        }
        return res;
      }
    }

    const randArray = (array) => {
      return array[Math.floor(Math.random() * array.length)];
    };

    class CanvasHandler {
      static canvasWrapperSelector = {
        fs: ".npv-main-container", // Full screen
        npv: "#VideoPlayerNpv_ReactPortal", // Now Playing View
      };
      static canvasExists = false;
      static anyWrapperExists = false;
      static canvasURL = "";
      static isVideo = true;

      static inFullscreen() {
        let fsDiv = document.querySelector(this.canvasWrapperSelector.fs);
        return (
          document.documentElement.classList.contains("fullscreen") &&
          fsDiv &&
          fsDiv.hasChildNodes()
        );
      }

      static hideCanvas() {
        document.body.classList.remove("canvas-show");
      }

      static showCanvas() {
        document.body.classList.add("canvas-show");
      }

      static clearCanvas() {
        log("[Canvas/CanvasHandler] Canvas cleared.");
        this.canvasExists = false;
        this.canvasURL = "";
        // no canvas, remove CSS
        this.hideCanvas();
      }

      static createWrapper() {
        log("[Canvas/CanvasHandler] Canvas video element appended to DOM.");
        let canvasWrapperElem = null;
        let canvasWrapper = document.createElement("div");
        canvasWrapper.id = "CanvasWrapper";

        if (this.isVideo) {
          let video = document.createElement("video");
          video.id = "CanvasDisplay";
          video.setAttribute("autoplay", "");
          video.setAttribute("loop", "");
          video.setAttribute("muted", "");
          video.setAttribute("crossorigin", "anonymous");
          video.setAttribute("playsinline", "");
          video.setAttribute("preload", "none");
          video.setAttribute("type", "video/mp4");
          canvasWrapper.appendChild(video);
        } else {
          let image = document.createElement("img");
          image.id = "CanvasDisplay";
          canvasWrapper.appendChild(image);
        }

        // add wrapper to DOM
        if (this.inFullscreen()) {
          if (config.enabledViews.includes("fs")) {
            canvasWrapperElem = document.querySelector(
              this.canvasWrapperSelector.fs
            );
          }
        } else {
          if (config.enabledViews.includes("npv")) {
            canvasWrapperElem = document.querySelector(
              this.canvasWrapperSelector.npv
            );
          }
        }

        if (canvasWrapperElem) {
          canvasWrapperElem.appendChild(canvasWrapper);
        }

        return canvasWrapper;
      }

      static getWrapper() {
        let wrapper = null;
        if (this.inFullscreen()) {
          if (config.enabledViews.includes("fs")) {
            wrapper = document.querySelector(
              this.canvasWrapperSelector.fs + " > #CanvasWrapper"
            );
          }
        } else {
          if (config.enabledViews.includes("npv")) {
            wrapper = document.querySelector(
              this.canvasWrapperSelector.npv + " > #CanvasWrapper"
            );
          }
        }
        if (!wrapper && this.shouldCreateWrapper()) {
          this.clearWrapper();
          wrapper = this.createWrapper();
        }
        return wrapper;
      }

      /*
      Determines if the wrappers exist, and only adds to the DOM if they actually do, otherwise it just spams for no reason.
      */
      static shouldCreateWrapper() {
        if (config.enabledViews.includes("npv")) {
          if (document.querySelector(this.canvasWrapperSelector.npv)) {
            this.anyWrapperExists = true;
            return true;
          }
        }
        if (config.enabledViews.includes("fs")) {
          if (document.querySelector(this.canvasWrapperSelector.fs)) {
            this.anyWrapperExists = true;
            return true;
          }
        }
        this.anyWrapperExists = false;
        return false;
      }

      static clearWrapper() {
        let wrapper = document.getElementById("CanvasWrapper");
        if (wrapper) {
          wrapper.remove();
        }
      }

      static getVideo() {
        let video = null;
        if (this.inFullscreen()) {
          if (config.enabledViews.includes("fs")) {
            video = document.querySelector(
              this.canvasWrapperSelector.fs +
                " > #CanvasWrapper > #CanvasDisplay"
            );
          }
        } else {
          if (config.enabledViews.includes("npv")) {
            video = document.querySelector(
              this.canvasWrapperSelector.npv +
                " > #CanvasWrapper > #CanvasDisplay"
            );
          }
        }
        if (!video) {
          video = this.getWrapper()?.children?.namedItem("CanvasDisplay");
        }
        return video;
      }

      static updateVideo() {
        let video = this.getVideo();
        if (this.canvasExists && this.anyWrapperExists) {
          if (video.src !== this.canvasURL) {
            this.setVideo(this.canvasURL);
          }
          if (this.isVideo) {
            if (video.paused) {
              video.play();
            }
          }
        }
      }

      static setCanvas(canvas) {
        if (!canvas) {
          this.clearCanvas();
          return;
        }
        this.canvasExists = true;
        log("[Canvas/Set] Setting Canvas URL:", canvas);
        this.canvasURL = canvas;
        this.setVideo(canvas);
      }

      static setVideo(canvas) {
        if (canvas.endsWith(".mp4") || !canvas) {
          // it's OK to put empty url in video tag but on an image it will show a broken image
          if (!this.isVideo) {
            this.clearWrapper();
          }
          this.isVideo = true;
        } else {
          if (this.isVideo) {
            this.clearWrapper();
          }
          this.isVideo = false;
        }

        let video = this.getVideo();
        // set src and update CSS classes to style properly
        video.src = canvas;
        this.showCanvas();

        if (this.isVideo) {
          // Go!
          video.load();
          video.play();
        }
      }
    }

    class SPClient {
      constructor() {
        this.spLocations = fetch("https://apresolve.spotify.com/?type=spclient")
          .then((res) => res.json())
          .then((res) => res.spclient)
          .catch((err) => {
            log("[Canvas/SPClient] Error while fetching spotify client!");
            log(err);
          });
      }

      /*
       * Helper that auto-initializes
       */
      static async create() {
        return await new SPClient().init();
      }

      /*
       * Must be called before any fetch requests! Resolves the server URLs
       */
      async init() {
        this.spLocationsResolved = await this.spLocations;
        return this;
      }

      /*
       * Retrieve a server URL from the list
       */
      getSpLocation() {
        return randArray(this.spLocationsResolved);
      }

      getToken() {
        return Spicetify.Platform.AuthorizationAPI._tokenProvider({
          preferCached: true,
        }).then((res) => res.accessToken);
      }

      /*
       * Send the request as raw binary data so protobuf works properly
       */
      fetchProtobufAuthRaw(urlExt, method, body) {
        return this.getToken()
          .then((token) =>
            fetch("https://" + this.getSpLocation() + urlExt, {
              method: method,
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/x-protobuf",
              },
              body: body,
            })
          )
          .then((res) => res.arrayBuffer())
          .catch((err) => {
            log(
              `[Canvas/SPClient] Error making protobuf request to hm:/${urlExt}!`
            );
            log(err);
          });
      }

      /*
       * Pretty protobuf wrapper
       */
      postCanvasRequest(track) {
        return this.fetchProtobufAuthRaw(
          "/canvaz-cache/v0/canvases",
          "POST",
          Protobuf.encodeRequest(track)
        )
          .then((res) => {
            log("[Canvas/SPClient] Request response (raw):");
            log(res);
            return Protobuf.decodeResponse(new Uint8Array(res));
          })
          .then((res) => {
            if (
              res === undefined ||
              !res.canvases ||
              res.canvases.length === undefined
            ) {
              return { canvases: [] };
            }
            return res;
          });
      }
    }

    const client = await SPClient.create();

    const onSongChange = async () => {
      // Do nothing if not initialized
      if (!Spicetify.Player.data) {
        return;
      }

      // track change, update canvas
      CanvasHandler.clearCanvas();
      let res = await client.postCanvasRequest(Spicetify.Player.data.item.uri);
      if (res.canvases.length > 0) {
        // pick a random canvas if there is multiple
        CanvasHandler.setCanvas(randArray(res.canvases).url);
      }
    };
    Spicetify.Player.addEventListener("songchange", onSongChange);

    setTimeout(() => {
      // Ensure the Canvas is playing and present every 0.1s
      setInterval(() => CanvasHandler.updateVideo(), 100);
      // Do an initial setup
      onSongChange();
    }, 1000);
  };
  window.addEventListener("load", onLoad, false);
})();
