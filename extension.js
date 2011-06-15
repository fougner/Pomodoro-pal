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
        this._stopTimer = true;
        this._sessionCount = 0;

        this._timer.set_text("[0] --:--");
        this.actor.add_actor(this._timer);

        let widget = new PopupMenu.PopupSwitchMenuItem(_("Toggle timer"), false);
        widget.connect("toggled", Lang.bind(this, this._toggleTimerState));
        this.menu.addMenuItem(widget);

        this._refreshTimer();
    },

    _toggleTimerState: function(item) {
        this._stopTimer = item.state;
        if (this._stopTimer == false) {
            this._stopTimer = true;
            this._timer.set_text("[" + this._sessionCount + "] --:--");
        }
        else {
            this._timeSpent = -1;
            this._stopTimer = false;
            this._refreshTimer();
        }
    },

    _refreshTimer: function() {
        if (this._stopTimer == false) {
            this._timeSpent += 1;
            if (this._timeSpent > 25) {
                this._timeSpent = 0;
                this._sessionCount += 1;
            }

            if (this._timeSpent < 10)
                this._timer.set_text("[" + this._sessionCount + "] 00:0" + this._timeSpent.toString());
            else
                this._timer.set_text("[" + this._sessionCount + "] 00:" + this._timeSpent.toString());

            Mainloop.timeout_add_seconds(60, Lang.bind(this, this._refreshTimer));
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