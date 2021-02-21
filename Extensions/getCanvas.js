(function getCanvas() {
  function importScript(url) {
    let script = document.createElement("script");
    script.src = url;
    script.setAttribute("crossOrigin", "");
    document.body.appendChild(script);
  }
  // get protobuf to encode requests
  importScript(
    "//cdn.rawgit.com/dcodeIO/protobuf.js/v6.10.2/dist/light/protobuf.min.js"
  );
  function onLoad() {
    // load protobuf format for request
    let root = protobuf.Root.fromJSON({
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
    let EntityCanvazRequest = root.lookupType(
      "com.spotify.canvazcache.EntityCanvazRequest"
    );
    let EntityCanvazResponse = root.lookupType(
      "com.spotify.canvazcache.EntityCanvazResponse"
    );
    let previousURI = "";
    let currentCanvas = "";
    let wrapper;

    function setCanvas(canvas) {
      currentCanvas = canvas;
      if (currentCanvas !== "") {
        let video = wrapper
          ? wrapper.children.namedItem("CanvasDisplay")
          : null;
        if (!video) {
          // inject video to DOM
          wrapper = document.createElement("div");
          wrapper.id = "CanvasWrapper";
          video = document.createElement("video");
          video.id = "CanvasDisplay";
          video.setAttribute("autoplay", "");
          video.setAttribute("loop", "");
          video.setAttribute("muted", "");
          video.setAttribute("crossorigin", "anonymous");
          video.setAttribute("playsinline", "");
          video.setAttribute("preload", "none");
          wrapper.appendChild(video);
        }
        // set src and update CSS classes to style properly
        video.src = canvas;
        video.type = "video/mp4";
        document.getElementsByTagName("body")[0].classList.add("canvas-show");
        // Go go gadget Canvas!
        video.load();
        video.play();
      } else {
        // no canvas, remove CSS
        document
          .getElementsByTagName("body")[0]
          .classList.remove("canvas-show");
      }
    }
    // start a little late because for some reason it sometimes runs before picking up the current track ID
    setTimeout(() => {
      setInterval(() => {
        if (!Spicetify.Player.data) {
          return;
        }
        // album art gets removed from DOM a lot, fix it!
        if (
          document.querySelectorAll("#video-player .album-art").length > 0 &&
          !document.getElementById("CanvasWrapper") &&
          wrapper
        ) {
          document
            .querySelectorAll("#video-player .album-art")[0]
            .appendChild(wrapper);
        }
        let video = document.getElementById("CanvasDisplay");
        // start the video if it stops (sometimes it doesn't start the first time)
        if (currentCanvas !== "" && video && video.paused === true) {
          video.play();
        }
        if (Spicetify.Player.data.track.uri != previousURI) {
          previousURI = Spicetify.Player.data.track.uri;
          setCanvas("");
          // send request encoded as UTF-8 string because cosmos is built for JSON not byte arrays
          Spicetify.CosmosAPI.resolver.post(
            {
              url: `hm://canvaz-cache/v0/canvases`,
              body: `${new TextDecoder().decode(
                EntityCanvazRequest.encode(
                  EntityCanvazRequest.create({
                    entities: [{ entityUri: previousURI }],
                  })
                ).finish()
              )}`,
            },
            (error, res) => {
              if (error) {
                console.log("Error retrieving canvas:");
                console.log(error);
                return;
              }
              // seriously, don't print this string
              let faceDemons = new TextEncoder().encode(res._body);
              let decoded;
              try {
                decoded = EntityCanvazResponse.decode(faceDemons).canvases;
              } catch (error) {
                // can't decode protobuf due to UTF-8's limitations as a raw binary data transport format. use regex to pull canvas link
                decoded = res._body.match(
                  /https:\/\/canvaz\.scdn\.co\/upload\/artist\/[a-zA-Z0-9]+\/video\/[a-zA-Z0-9\-]+.cnvs.mp4/gm
                );
                // note that sometimes this fails because the string will terminate early due to weird UTF-8 responses. Not much we can do about this unless I can figure out how to use Bridge with raw binary data.
              }
              if (
                decoded &&
                typeof decoded === "object" &&
                typeof decoded.length === "number" &&
                decoded.length > 0
              ) {
                setCanvas(decoded[0]);
              }
            }
          );
        }
      }, 50);
    }, 1000);
  }
  window.addEventListener("load", onLoad, false);
})();
