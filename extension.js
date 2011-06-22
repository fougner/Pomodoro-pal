const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Gettext = imports.gettext.domain('gnome-shell');
const _ = Gettext.gettext;

const Schema = new Gio.Settings({ schema: 'org.gnome.shell.extensions.pomodoro' });
const POMODORO_CONFIG = "pomodoro-config.py";
const TIME_ADJUSTMENT_STEP = 0.05; /* Volume adjustment step in % */
const TIME_DIVIDE = 1000000; /* get_monotonic_time() returns microseconds, we want seconds */
let _pomodoroInit = false;

function Indicator() {
	this._init.apply(this, arguments);
}

Indicator.prototype = {
	__proto__: PanelMenu.SystemStatusButton.prototype,

	_init: function() {
		PanelMenu.SystemStatusButton.prototype._init.call(this, 'text-x-generic-symbol');

		let box = new St.BoxLayout();

		this._timerLabel = new St.Label({ text: "--:--", style_class: 'panel-timer-label' });
		this._sessionLabel = new St.Label({ text: "[0]", style_class: 'panel-session-label' });
		this._timeSpent = 0;
		this._timerActive = false;
		this._sessionCount = 0;
		box.add_actor(this._sessionLabel);
		box.add_actor(this._timerLabel);
		this._period = Schema.get_int('period');
		this._switch = new PopupMenu.PopupSwitchMenuItem(_("Toggle timer"), false);
		this._switch.connect("toggled", Lang.bind(this, this._toggleTimerState));
		this.menu.addMenuItem(this._switch);

		this._outputSlider = new PopupMenu.PopupSliderMenuItem(0);
        this._outputSlider.connect('value-changed', Lang.bind(this, this._sliderChanged));
        this.menu.addMenuItem(this._outputSlider);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._dbug = new PopupMenu.PopupMenuItem(_("Pomodoro Settings"));
        this._dbug.connect('activate', function(){Util.spawnCommandLine('pomodoro-config');});
        this.menu.addMenuItem(this._dbug);
        this.actor.set_child(box);
	},

    _sliderChanged: function(slider, value) {
  
        let time = value * this._period * 60 ;
        this._updateTimer();
        if (time < 5) {
            this._timeSpent = 0;
        } else {
            this._timeSpent = time;
        }
        //this._dbug.label.set_text("Slider: " + Math.floor(time) + " Pomodoro Period: " + this._period);
        this._refreshTimer();
    },

	_toggleTimerState: function(item) {
		this._destroyBreak();
		if (item.state) {
			this._startTimer();
			this._startTime = Math.round(GLib.get_monotonic_time() /TIME_DIVIDE);
			this._refreshTimer();
		}
		else {
			this._timeSpent += Math.round(GLib.get_monotonic_time()/TIME_DIVIDE) - this._startTime;
			this._stopTimer();
			//this._timerLabel.set_text("[" + this._sessionCount + "] --:--");
		}
	},

	_updateTimer: function() {
		let now = Math.floor(GLib.get_monotonic_time() / TIME_DIVIDE);
		this._timeSpent += now - this._startTime;
		this._startTime = now;
	},

	_resetTimer: function() {
		this._timeSpent = 0;
		this._outputSlider.setValue(0);
	},

	_stopTimer: function() {
		this._timerActive = false;
	},

	_startTimer: function() {
		this._timerActive = true;
	},

	_getTime: function() {
		let res = "";
		let min = Math.floor(this._timeSpent / 60);
		let sec = Math.floor(this._timeSpent % 60);
		if(min < 10) 
			res += "0"+min;
		else
			res += min;
		res += ":";
		if(sec < 10)
			res += "0"+sec;
		else
			res += sec;
		
		return  res;
	},

	_refreshTimer: function(){

		if(this._timeSpent <= this._period*60 ) {
			if(this._timerActive) {
					this._updateTimer();
					Mainloop.timeout_add_seconds(1, Lang.bind(this, this._refreshTimer));
			}
			this._outputSlider.setValue(this._timeSpent / (this._period * 60));
			let minutes = Math.floor(this._timeSpent / 60);
			this._timerLabel.set_text(this._getTime());
			this._sessionLabel.set_text("[" + this._sessionCount + "]");
		} else {
			this._stopTimer();
			this._resetTimer();
			this._switch.setToggleState(false);
			this._showBreak(_("You're on a break!"), 5*60);
		}
		return false;
	},

	_showBreak: function(msg, timeout) {
		this._destroyBreak();
		this._breakLabel = new St.Label({ style_class: 'break-label', text: msg });
		let monitor = global.get_primary_monitor();
		global.stage.add_actor(this._breakLabel);
		this._breakLabel.set_position(Math.floor (monitor.width / 2 - this._breakLabel.width / 2),
				Math.floor(monitor.height / 2 - this._breakLabel.height / 2));
		Mainloop.timeout_add( timeout * 1000, Lang.bind(this, this._destroyBreak) );
	  },

	_destroyBreak: function(){
		if(this._breakLabel)  
			this._breakLabel.destroy();
	}

};

function main() {
	if (!_pomodoroInit) {
		Main.StatusIconDispatcher.STANDARD_TRAY_ICON_IMPLEMENTATIONS['pomodoro'] = 'pomodoro';
		Main.Panel.STANDARD_TRAY_ICON_ORDER.unshift('pomodoro');
		Main.Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['pomodoro'] = Indicator;
		_pomodoroInit = true;
	}
}
