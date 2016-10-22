'use_strict';

const library = {};
const libraries = []

let player;
let live = false;
let socket = new WebSocket("wss://sockets.temp.discord.fm");
let song;
let lastSong;

socket.onmessage = (event) => {
  if (!live) return;
  let data = JSON.parse(event.data);
  if (data.data.bot != localStorage.channel) return;
  lastSong = data.data.song;
  loadVideo();
}

function initPlayer() {
  if (!localStorage.channel) {
    localStorage.channel = "all";
  }
  $("#" + localStorage.channel).addClass("active")

  let tag = document.createElement('script');

  tag.src = "https://www.youtube.com/iframe_api";
  let firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  $(".cnl-btn").click((e) => {
    console.log("click");
    $(".cnl-btn").removeClass("active")
    $(e.target).addClass("active")
    localStorage.channel = $(e.target).attr("id")
    console.log(localStorage.channel);
    loadVideo()
  })
}

function init(lib){
  library[lib] = JSON.parse(sessionStorage[lib])
}

$.get("https://temp.discord.fm/libraries/json", (data) => {
  $.each(data, (ind, val) => {
    $("#libraries").append(`<a href="#!" class="collection-item cnl-btn" id="${val.id}">${val.name}</a>`)
    if (!sessionStorage[val.id]) {
      $.get("https://temp.discord.fm/libraries/" + val.id + "/json", (data) => {
        sessionStorage[val.id] = JSON.stringify(data);
        init(val.id)
      })
    } else {
      init(val.id)
    }
  })

  setInterval(() => {
    if (Object.keys(library).length == data.length) {
      library['all'] = []
      $.each(library, function(ind, val){
        library['all'] = library['all'].concat(val)
      })
      initPlayer()
    }
  }, 250)
});

function loadVideo() {
  let song;

  try {
    if (!live) song = library[localStorage.channel][Math.floor(Math.random() * library[localStorage.channel].length)]
    if (live) song = lastSong;
  } catch (err) {
    song = {
      identifier: "dQw4w9WgXcQ",
      title: "Something went wrong :("
    }
  }

  if (!song) song = {
    identifier: "dQw4w9WgXcQ",
    title: "Something went wrong :("
  }

  $("#videoTitle").text(song.title)
  player.loadVideoById(song.identifier, 0, "large")
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
  try {
    song = library[localStorage.channel][Math.floor(Math.random() * library[localStorage.channel].length)]    
  } catch (err) {
    song = {
      identifier: "dQw4w9WgXcQ",
      title: "Loading libraries."
    }
  }

  if (!song) song = {
    identifier: "dQw4w9WgXcQ",
    title: "Something went wrong :("
  }

  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: song.identifier,
    events: {
      onReady: event => {
        $("#videoTitle").text(song.title)

        setInterval(() => {
          if (player.getPlayerState() == 1) {
            time = player.getCurrentTime()

            $("#progress").css("width", time / player.getDuration() * 100 + "%")
          }
        }, 250)

        event.target.playVideo();
      },

      onStateChange: event => {
        if (!live) {
          if (event.data == 0) {
            loadVideo()
          } else if (event.data == 2) {
            $("#pp-icon").text("play_arrow")
          } else {
            $("#pp-icon").text("pause")
          }
        } else {
          if (event.data != 0) {
            player.playVideo();
          }
        }
      },

      onError: () => loadVideo()
    },
    playerVars: {
      controls: 0,
      rel: 0,
      iv_load_policy: 3,
      fs: 0,
      showinfo: 0
    }
  });
}

function initWebsocket() {
  $.get("https://temp.discord.fm/libraries/" + localStorage.channel + "/queue", (data) => {
    let startTime = new Date(data.playStart);
    let position = Math.floor(Math.abs(Date.now() - startTime) / 1000);

    $("#videoTitle").text(data.current.title)
    player.loadVideoById(data.current.identifier, 0, "large")
    player.seekTo(position);
  });
}

$("#videoLink").click(() => {
  player.pauseVideo()
})

$("#play-pause").click(() => {
  if (player.getPlayerState() == 1) {
    player.pauseVideo()
  } else {
    player.playVideo()
  }
})

$("#skip").click(() => {
  loadVideo()
})

$("body").keypress(key => {
  if (live) return;
  if (key.keyCode == 32) {
    key.preventDefault();
    if (player.getPlayerState() == 1) {
      player.pauseVideo()
    } else {
      player.playVideo()
    }
  }
})

$("#volume").change(() => {
  player.setVolume($("#volume").val());
});

$("#live").click(() => {
  if (!live) {
    live = true;    
    $("#play-pause").prop('disabled', true);
    $("#skip").prop('disabled', true);
    initWebsocket();
  } else {
    live = false;    
    $("#play-pause").prop('disabled', false);
    $("#skip").prop('disabled', false);
    loadVideo();
  }
});