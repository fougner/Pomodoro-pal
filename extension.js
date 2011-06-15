const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Util = imports.misc.util;
const Gettext = imports.gettext.domain('gnome-shell');
const _ = Gettext.gettext;

const Schema = new Gio.Settings({ schema: 'org.gnome.shell.extensions.pomodoro' });
const POMODORO_CONFIG = "pomodoro-config.py";

let _pomodoroInit = false;

function Indicator() {
	this._init.apply(this, arguments);
}

Indicator.prototype = {
	__proto__: PanelMenu.SystemStatusButton.prototype,

	_init: function() {
		PanelMenu.SystemStatusButton.prototype._init.call(this, 'text-x-generic-symbol');

		this._timer = new St.Label();
		this._timeSpent = -1;
		this._timerActive = false;
		this._sessionCount = 0;

		this._timer.set_text("[0] --:--");
		this.actor.add_actor(this._timer);

		let tt = new PopupMenu.PopupSwitchMenuItem(_("Toggle timer"), false);
		tt.connect("toggled", Lang.bind(this, this._toggleTimerState));
		this.menu.addMenuItem(tt);

		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

		let settingsitem = new PopupMenu.PopupMenuItem(_("Pomodoro Settings"));
		settingsitem.connect('activate', function () { Util.spawn("pomodoro-config")});
		this.menu.addMenuItem(settingsitem);

		this._refreshTimer();
	},

	_toggleTimerState: function(item) {
		this._timerActive = item.state;
		if (this._timerActive){
			this._timeSpent = -1;
			this._timerActive = false;
			this._refreshTimer();
		}
		else {
			this._timerActive = true;
			this._timer.set_text("[" + this._sessionCount + "] --:--");
		}
	},

	_refreshTimer: function() {
		if (this._timerActive) {
			let period = Schema.get_int('period');
			this._timeSpent += 1;
			if (this._timeSpent > period) {
				this._timeSpent = 0;
				this._sessionCount += 1;
				this._showBreak("You're on a break!", 5*60 );
				this._toogleTimerState();
			}

			if (this._timeSpent < 10)
				this._timer.set_text("[" + this._sessionCount + "] 00:0" + this._timeSpent.toString());
			else
				this._timer.set_text("[" + this._sessionCount + "] 00:" + this._timeSpent.toString());

			Mainloop.timeout_add_seconds(60, Lang.bind(this, this._refreshTimer));
		}

		return false;
	},

	_showBreak: function(msg, timeout) {
		this._breakLabel = new St.Label({ style_class: 'break-label', text: msg });
		let monitor = global.get_primary_monitor();
		global.stage.add_actor(this._breakLabel);
		this._breakLabel.set_position(Math.floor (monitor.width / 2 - this._breakLabel.width / 2),
			Math.floor(monitor.height / 2 - this._breakLabel.height / 2));
		Mainloop.timeout_add( timeout*1000, function () { this._breakLabel.destroy(); });
	}
}

function main() {
	if (!_pomodoroInit) {
		Main.StatusIconDispatcher.STANDARD_TRAY_ICON_IMPLEMENTATIONS['pomodoro'] = 'pomodoro';
		Main.Panel.STANDARD_TRAY_ICON_ORDER.unshift('pomodoro');
		Main.Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['pomodoro'] = Indicator;
		_pomodoroInit = true;
	}
}
