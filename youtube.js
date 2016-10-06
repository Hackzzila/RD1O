var library = {}
var apiKey = "AIzaSyBAjUbzF1TPsIWDOovtuZgN0I8ZY1xK9Js"
var videoId
var player

function initPlayer() {
  if (!localStorage["channel"]) {
    localStorage["channel"] = "all"
  }
  $("#dfm_" + localStorage.channel).addClass("active")

  var tag = document.createElement('script');

  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function init(lib){
  library[lib] = JSON.parse(sessionStorage[lib])
}

libraries = [
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

$.each(libraries, function(ind, val){
  if (!sessionStorage[val]) {
    $.get("https://temp.discord.fm/libraries/" + val + "/json", function(data){
      sessionStorage[val] = JSON.stringify(data);
      init(val)
    })
  } else {
    init(val)
  }
})

setInterval(function(){
  if (Object.keys(library).length == 9) {
    library['all'] = []
    $.each(library, function(ind, val){
      library['all'] = library['all'].concat(val)
    })
    initPlayer()
  }
}, 250)

function loadVideo() {
  videoId = library[localStorage.channel][Math.floor(Math.random() * library[localStorage.channel].length)].identifier

  $.get("https://www.googleapis.com/youtube/v3/videos", {
    part: "snippet",
    id: videoId,
    key: apiKey
  }, function(data){
    $("#videoTitle").text(data.items[0].snippet.title)
  })

  $("#videoLink").attr("href", "https://www.youtube.com/watch?v=" + videoId)

  player.loadVideoById(videoId, 0, "large")
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  videoId = library[localStorage.channel][Math.floor(Math.random() * library[localStorage.channel].length)].identifier

  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: videoId,
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
  $.get("https://www.googleapis.com/youtube/v3/videos", {
    part: "snippet",
    id: videoId,
    key: apiKey
  }, function(data){
    $("#videoTitle").text(data.items[0].snippet.title)
  })

  setInterval(function(){
    if (player.getPlayerState() == 1) {
      time = player.getCurrentTime()

      $("#progress").css("width", time / player.getDuration() * 100 + "%")
    }
  }, 250)


  $("#videoLink").attr("href", "https://www.youtube.com/watch?v=" + videoId)

  event.target.playVideo();
}

function onPlayerStateChange(event) {
  if (event.data == 0) {
    loadVideo()
  } else if (event.data == 2) {
    $("#pp-icon").text("play_arrow")
  } else {
    $("#pp-icon").text("pause")
  }
}

function onPlayerError(event) {
  loadVideo()
}

$("#videoLink").click(function(){
  player.pauseVideo()
})

$("#play-pause").click(function(){
  if (player.getPlayerState() == 1) {
    player.pauseVideo()
  } else {
    player.playVideo()
  }
})

$("#skip").click(function(){
  loadVideo()
})

$(".cnl-btn").click(function(){
  $(".cnl-btn").removeClass("active")
  $(this).addClass("active")
  localStorage.channel = $(this).attr("id").replace("dfm_", "")
  loadVideo()
})

$("body").keypress(function(key){
  if (key.keyCode == 32) {
    key.preventDefault();
    if (player.getPlayerState() == 1) {
      player.pauseVideo()
    } else {
      player.playVideo()
    }
  }
})