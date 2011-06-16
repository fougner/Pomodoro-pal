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

let _pomodoroInit = false;

function Indicator() {
    this._init.apply(this, arguments);
}

Indicator.prototype = {
    __proto__: PanelMenu.SystemStatusButton.prototype,

    _init: function() {
        PanelMenu.SystemStatusButton.prototype._init.call(this, 'text-x-generic-symbol');

        this._timer = new St.Label();
        this._timeSpent = 0;
        this._timerActive = false;
        this._sessionCount = 0;

        this._timer.set_text("[0] --:--");
        this.actor.add_actor(this._timer);

        let widget = new PopupMenu.PopupSwitchMenuItem(_("Toggle timer"), false);
        widget.connect("toggled", Lang.bind(this, this._toggleTimerState));
        this.menu.addMenuItem(widget);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    },

    _toggleTimerState: function(item) {
        if (item.state) {
            this._timerActive = true;
            this._startTime = Math.round(GLib.get_monotonic_time() / 1000);
            this._refreshTimer();
        }
        else {
            this._timeSpent += Math.round(GLib.get_monotonic_time()/1000) - this._startTime;
            this._timerActive = false;
            //this._timer.set_text("[" + this._sessionCount + "] --:--");
        }
    },

    _updateTimer: function() {
        let now = Math.round(GLib.get_monotonic_time() / 1000);
        this._timeSpent += now - this._startTime;
        this._startTime = now;
    },

    _refreshTimer: function(){
        this._updateTimer();
        if (this._timerActive){
            let period = Schema.get_int('period');
            global.log('pomodoro period from Schema:' + period.toString());
            global.log('time: ' + this._timeSpent.toString());
            
            let minutes = Math.floor(this._timeSpent.toString()/1000 / 60);

            if (minutes < 10)
                this._timer.set_text("[" + this._sessionCount + "] 00:0" + minutes);
            else
                this._timer.set_text("[" + this._sessionCount + "] 00:" + minutes);

            Mainloop.timeout_add_seconds(1, Lang.bind(this, this._refreshTimer));
        }
        return false;
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
