Pomodoro Pal extension
======================

![Dialogue](/fougner/Pomodoro-pal/raw/master/screenshots/print1.png)
![Coffee time!](https://github.com/fougner/Pomodoro-pal/raw/master/screenshots/print2.png)


## Install extension

* mkdir -p ~/.local/share/gnome-shell/extensions/
* cd ~/.local/share/gnome-shell/extensions/
* git clone https://fougner@github.com/fougner/Pomodoro-pal.git pomodoro-pal@fougner.me

# Install Schema

* cd pomodoro-pal@fougner.me
* sudo cp org.gnome.shell.extensions.pomodoro.gschema.xml /usr/share/glib-2.0/schemas/
* sudo glib-compile-schemas /usr/local/share/glib-2.0/schemas/


# Install configurator (optional)

* cd pomodoro-pal@fougner.me
* sudo cp pomodoro-config.py /usr/bin/pomodoro-config
* sudo chmod 755 /usr/bin/pomodoro-config
