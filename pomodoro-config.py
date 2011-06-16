#!/usr/bin/env python
# -*- coding: utf-8 -*-
# -*- Mode: Python; py-indent-offset: 4 -*-
# vim: tabstop=4 shiftwidth=4 expandtab

from gi.repository import Gtk, Gio, Gdk

#import gettext
#from gettext import gettext as _
#gettext.textdomain('system-monitor-applet')


class IntSelect:
	def __init__(self, name):
		self.label = Gtk.Label(name + ":")
		self.spin = Gtk.SpinButton()
		self.actor = Gtk.HBox()
		self.actor.add(self.label)
		self.actor.add(self.spin)
		self.spin.set_numeric(True)

	def set_args(self, minv, maxv, incre, page):
		self.spin.set_range(minv, maxv)
		self.spin.set_increments(incre, page)

	def set_value(self, value):
		self.spin.set_value(value)


class Select:
	def __init__(self, name):
		self.label = Gtk.Label(name + ":")
		self.selector = Gtk.ComboBoxText()
		self.actor = Gtk.HBox()
		self.actor.add(self.label)
		self.actor.add(self.selector)

	def set_value(self, value):
		self.selector.set_active(value)

	def add(self, items):
		for item in items:
			self.selector.append_text(item)


def set_boolean(check, schema, name):
	schema.set_boolean(name, check.get_active())


def set_int(spin, schema, name):
	schema.set_int(name, spin.get_value_as_int())
	return False


def set_enum(combo, schema, name):
	schema.set_enum(name, combo.get_active())


class SettingFrame:
	def __init__(self, name, schema):
		self.schema = schema
		self.label = Gtk.Label(name)
		self.frame = Gtk.Frame()
		self.frame.set_border_width(10)
		self.vbox = Gtk.VBox(spacing=20)
		self.hbox0 = Gtk.HBox(spacing=20)
		self.hbox1 = Gtk.HBox(spacing=20)
		#self.hbox2 = Gtk.HBox(spacing=20)
		self.frame.add(self.vbox)
		self.vbox.pack_start(self.hbox0, True, False, 0)
		self.vbox.pack_start(self.hbox1, True, False, 0)
		#self.vbox.pack_start(self.hbox2, True, False, 0)

	def add(self, key):
		sections = key.split('-')
		if sections[1] == 'display':
			item = Gtk.CheckButton(label=_('Display'))
			item.set_active(self.schema.get_boolean(key))
			self.hbox0.add(item)
			item.connect('toggled', set_boolean, self.schema, key)
		elif sections[1] == 'refresh':
			item = IntSelect(_('Refresh Time'))
			item.set_args(5, 55, 1, 1000)
			item.set_value(self.schema.get_int(key))
			self.hbox1.add(item.actor)
			item.spin.connect('output', set_int, self.schema, key)


class App:
	opt = {}
	#setting_items = ('cpu', 'memory', 'swap', 'net', 'disk')

	def __init__(self):
		self.schema = Gio.Settings('org.gnome.shell.extensions.pomodoro')
		keys = self.schema.keys()
		self.window = Gtk.Window(title='Pomodoro')
		self.window.connect('destroy', Gtk.main_quit)
		self.window.set_border_width(10)
		
		self.main_vbox = Gtk.VBox(spacing=10)
		self.main_vbox.set_border_width(10)
		self.hbox1 = Gtk.HBox(spacing=20)
		self.hbox1.set_border_width(10)
		self.main_vbox.pack_start(self.hbox1, False, False, 0)
		self.window.add(self.main_vbox)
		item = Gtk.CheckButton(label='Display in center (default is to the right)')
		item.set_active(self.schema.get_boolean('center-display'))
		#self.items.append(item)
		self.hbox1.add(item)
		item.connect('toggled', set_boolean, self.schema, 'center-display')

		item = IntSelect('Pomodoro period (minutes)')
		item.set_args(5, 120, 1, 1000)
		item.set_value(self.schema.get_int('period'))
		self.hbox1.add(item.actor)
		item.spin.connect('output', set_int, self.schema, 'period')

		self.notebook = Gtk.Notebook()
		#for setting in self.setting_items:
		#	self.notebook.append_page(
		#		self.settings[setting].frame, self.settings[setting].label)
		self.main_vbox.pack_start(self.notebook, True, True, 0)
		self.window.set_resizable(False)
		self.window.show_all()


def main():
	App()
	Gtk.main()

if __name__ == '__main__':
	main()