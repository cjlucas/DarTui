USAGE
-----
- Keyboard Shortcuts
	- General
		- F - Show/Hide filter menu
		- Alt+A - Select all torrents
		- Esc - Deselect all torrents
		- Tip: shift clicking can be used to select a range of torrents
	- When the Batch Actions Menu is showing
		- S - Start selected torrents
		- P - Pause selected torrents
		- D - Delete selected torrents
		- R - Rehash selected torrents

REQUIREMENTS
------------
- [Python](http://www.python.org/) 2.6.x and 2.7.x (Linux/OSX only)
- [web.py](http://webpy.org/)
- [rtorrent-python](https://github.com/cjlucas/rtorrent-python)
- A proper XMLRPC server setup (see: http://libtorrent.rakshasa.no/wiki/RTorrentXMLRPCGuide)
- Any major browser except Internet Explorer

INSTALLATION
------------

To Install:
```$ python setup.py install```

To Run:
```$ dartui```

TODO
----
- Better logging
- HTTPS support
- Basic HTTP authentication support
- Torrent details view (file/peers/trackers)
- Mobile interface
- Filter torrents via search
