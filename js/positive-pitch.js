var SCALE_CHROMATIC = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
var SCALE_MINOR = [0, 2, 3, 5, 7, 8, 10];
var SCALE_MAJOR = [0, 2, 4, 5, 7, 9, 11];
var KEYMAP = {
    "A": 0,
    "W": 1,
    "S": 2,
    "E": 3,
    "D": 4,
    "F": 5,
    "T": 6,
    "G": 7,
    "Z": 8,
    "H": 9,
    "U": 10,
    "J": 11,
}
var DEFAULTS = {
    chordSize: 2,
    tonicOn: true,
    displayNoteNames: true,
    displayKeyboardControls: true,
    previewNotes: false,
};

function supports_html5_storage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }   
}

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

var channel_max = 20;
var audiochannels = new Array();

for (i = 0; i < channel_max; i++) {
	audiochannels[i] = new Array();
	audiochannels[i]['channel'] = new Audio();
	audiochannels[i]['finished'] = -1;
}

function playSound(s) {
    s = "sound_" + (s);
	for (i = 0; i < audiochannels.length; i++) {
		thistime = new Date();
		if (audiochannels[i]['finished'] < thistime.getTime()) { // is this channel finished?
			audiochannels[i]['finished'] = thistime.getTime() + document.getElementById(s).duration*1000;
			audiochannels[i]['channel'].src = document.getElementById(s).src;
			audiochannels[i]['channel'].load();
			audiochannels[i]['channel'].play();
			break;
		}
	}
}

function PositivePitch() {
    this.notes = [];
    this.guesses = [];
    this.currentChord = []
    this.timer = null;
    this.chordSize = DEFAULTS.chordSize;
    this.tonicOn = DEFAULTS.tonicOn;
    this.previewNotes = DEFAULTS.previewNotes;
    this.totalGuesses = 0;
    this.rightGuesses = 0;
    this.confirmed = false;

    for (var i = 0; i < 12; i++) {
        this.notes.push(i);
    }

    this.setScale = function(scale) {
        console.log(scale);
        if (scale.toLowerCase() == "minor") {
            this.notes = SCALE_MINOR;
        } else if (scale.toLowerCase() == "major") {
            this.notes = SCALE_MAJOR;
        } else if (scale.toLowerCase() == "chromatic") {
            this.notes = SCALE_CHROMATIC;
        }
    }
    this.getRandomNotes = function(len) {
        var pick = shuffle(this.notes);
        return pick.slice(0, len);
    }

    this.startGuess = function() {
        this.confirmed = false;
        if (this.tonicOn) {
            this.playTonic();
            var that = this;
            timer = setTimeout(function() {that.playChord()}, 2000);
        } else {
            this.playChord();
        }
    }

    this.playTonic = function() {
        playSound(0);
    }

    this.newChord = function() {
        this.currentChord = this.getRandomNotes(this.chordSize);
    }

    this.playChord = function() {
        for (var i = 0; i < this.chordSize; i++) {
            playSound(this.currentChord[i]);
        }
    }

    this.addGuess = function(guess) {
        this.previewNotes && playSound(guess);
        if ($("#key_" + guess).hasClass("white-key")) {
            $("#key_" + guess).toggleClass("active-white");
        } else {
            $("#key_" + guess).toggleClass("active-black");
        }
        var index = this.guesses.indexOf(guess);
        if (index === -1)
            this.guesses.push(guess);
        else
            this.guesses.splice(index,1);
    }

    this.confirmGuess = function() {
        this.displayCorrectChord();
        this.confirmed || this.totalGuesses++;
        if (this.currentChord.length !== this.guesses.length) {
            this.confirmed = true;
            return false;
        }
        for (var i = 0; i < this.currentChord.length; i++) {
            if (this.guesses.indexOf(this.currentChord[i]) === -1) {
                this.confirmed = true;
                return false;
            }
        }
        this.confirmed || this.rightGuesses++;
        this.confirmed = true;
        return true;
    }

    this.displayCorrectChord = function() {
        for (var i = 0; i < this.currentChord.length; i++) {
            $("#key_" + this.currentChord[i]).addClass("correct");
        }
    }

    this.init = function() {
        this.guesses = [];
        this.currentChord = []
    }

    this.handleKey = function(e) {
        var pressed = e.keyCode;
        if (pressed == 32) { // space key
            e.preventDefault();
            $("#repeat").trigger("click");
        } else if (pressed == 13) { // enter key
            e.preventDefault();
            $("#submit").trigger("click");
        } else if (pressed == 9) { // tab key
            e.preventDefault();
            $("#play").trigger("click");
        }
        pressed = String.fromCharCode(pressed);
        if (KEYMAP[pressed] !== undefined) 
            this.addGuess(KEYMAP[pressed]);
    }
}

window.onload = function() {
    var pp = new PositivePitch();
    var timer = null;
    $("#play").click(function() {
        $("#result").text("");
        $(".key").removeClass("active-white");
        $(".key").removeClass("active-black");
        $(".key").removeClass("correct");
        pp.init();
        pp.newChord();
        pp.startGuess();
    });
    $("#submit").click(function() {
        if (pp.confirmGuess()) {
            $("#result").text("Correct");
        } else {
            $("#result").text("Wrong");
        }
        $("#total-guesses").text(pp.totalGuesses);
        $("#right-guesses").text(pp.rightGuesses);
        $("#percentage-right").text(
            Math.round(1000*(pp.rightGuesses/pp.totalGuesses))/10);
    });
    $("#repeat").click(function() {
        pp.playChord();
    });
    $("#tonic").change(function() {
        pp.tonicOn = $(this).prop("checked");
        localStorage["tonic"] = pp.tonicOn;
    });
    $("#display-notename").change(function() {
        $(".notename").toggle();
        localStorage["displayNoteNames"] = $("#display-notename").prop("checked");
    });
    $("#display-controls").change(function() {
        $(".controls").toggle();
        localStorage["displayKeyboardControls"] = $("#display-controls").prop("checked");
    });
    $("#preview-notes").change(function() {
        pp.previewNotes = $(this).prop("checked");
        localStorage["previewNotes"] = $("#preview-notes").prop("checked");
    });
    $("#chordsize").change(function() {
        pp.chordSize = parseInt($(this).val());
        localStorage["chordSize"] = pp.chordSize;
    });
    $("#scale-selector").change(function() {
        pp.setScale($("#scale-selector").val());
        localStorage["scale"] = $("#scale-selector").val();
    });
    $("#help").click(function() {
        $(".help-outer").show();
        $(".help-outer").click(function() {
            $(".help-outer").hide();
        });
    });
    /*for (var i = 0; i < 12; i++) {*/
    /*$("#key_" + i).click(function() {var a = i; pp.addGuess(a);});*/
    /*}*/
    $("#key_0").click(function() {pp.addGuess(0);});
    $("#key_1").click(function() {pp.addGuess(1);});
    $("#key_2").click(function() {pp.addGuess(2);});
    $("#key_3").click(function() {pp.addGuess(3);});
    $("#key_4").click(function() {pp.addGuess(4);});
    $("#key_5").click(function() {pp.addGuess(5);});
    $("#key_6").click(function() {pp.addGuess(6);});
    $("#key_7").click(function() {pp.addGuess(7);});
    $("#key_8").click(function() {pp.addGuess(8);});
    $("#key_9").click(function() {pp.addGuess(9);});
    $("#key_10").click(function() {pp.addGuess(10);});
    $("#key_11").click(function() {pp.addGuess(11);});
    document.onkeydown = function(e) {pp.handleKey(e);};

    if (supports_html5_storage()) {
        if (localStorage["hasStorage"] == true) {
            // load stored state
            pp.tonicOn = localStorage["tonic"];
            $("#tonic").prop("checked", localStorage["tonic"]);
        } else {
            localStorage["hasStorage"] = true;
            localStorage["tonic"] = DEFAULTS.tonicOn;
            localStorage["displayNotenames"] = DEFAULTS.displayNoteNames;
            localStorage["displayControls"] = DEFAULTS.displayKeyboardControls;
            localStorage["previewNotes"] = DEFAULTS.previewNotes;
            localStorage["chordSize"] = DEFAULTS.chordSize;
        }
    }
}
