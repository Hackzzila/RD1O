'use_strict';

const library = {};
const libraries = [
  "electro-hub",
  "chill-corner",
  "korean-madness",
  "japanese-lounge",
  "retro-renegade",
  "metal-mix",
  "hip-hop",
  "rock-n-roll",
  "coffee-house-jazz"
]

let player;
let live = false;
let socket = new WebSocket(" wss://sockets.temp.discord.fm");
let song;
let lastSong;

socket.onmessage = (event) => {
  let data = JSON.parse(event.data);
  console.log(data.data);
  if (data.data.bot != localStorage.channel) return;
  lastSong = data.data.song;
  loadVideo();
}

function initPlayer() {
  if (!localStorage["channel"]) {
    localStorage["channel"] = "all";
  }
  $("#" + localStorage.channel).addClass("active")

  let tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  let firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function init(lib){
  library[lib] = JSON.parse(sessionStorage[lib])
}

$.each(libraries, (ind, val) => {
  if (!sessionStorage[val]) {
    $.get("https://temp.discord.fm/libraries/" + val + "/json", (data) => {
      sessionStorage[val] = JSON.stringify(data);
      init(val)
    })
  } else {
    init(val)
  }
})

setInterval(() => {
  if (Object.keys(library).length == 9) {
    library['all'] = []
    $.each(library, function(ind, val){
      library['all'] = library['all'].concat(val)
    })
    initPlayer()
  }
}, 250)

function loadVideo() {
  let song;

  if (!live) song = library[localStorage.channel][Math.floor(Math.random() * library[localStorage.channel].length)]
  if (live) song = lastSong;

  $("#videoTitle").text(song.title)
  player.loadVideoById(song.identifier, 0, "large")
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
  song = library[localStorage.channel][Math.floor(Math.random() * library[localStorage.channel].length)]

  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: song.identifier,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    },
    playerVars: {
      "controls": 0,
      "rel": 0,
      "iv_load_policy": 3,
      'fs': 0,
      "showinfo": 0
    }
  });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  $("#videoTitle").text(song.title)

  setInterval(() => {
    if (player.getPlayerState() == 1) {
      time = player.getCurrentTime()

      $("#progress").css("width", time / player.getDuration() * 100 + "%")
    }
  }, 250)

  event.target.playVideo();
}

function onPlayerStateChange(event) {
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
}

function onPlayerError(event) {
  loadVideo()
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

$(".cnl-btn").click(() => {
  $(".cnl-btn").removeClass("active")
  $(this).addClass("active")
  localStorage.channel = $(this).attr("id")
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